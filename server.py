#!/usr/bin/env python3
import base64
import io
import json
import os
import sqlite3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / 'site_data.db'
UPLOADS_DIR = ROOT / 'uploads'
PORT = int(os.environ.get('PORT', '8089'))

DEFAULT_FAQ = [
    {
        'question': 'С какими сервисами работали?',
        'answer': 'В работе с маркетплейсами я использовал MpStats, WildBox, MarketGuru, Evirma, MpManager, Google Таблицы, Miro, Canva и Gamma. Сервисы аналитики использую для оценки спроса, конкурентов, семантики и динамики карточек, а таблицы и визуальные инструменты — чтобы считать показатели, собирать понятную систему работы и ставить ТЗ на улучшение карточек.'
    },
    {
        'question': 'Чем автоматическая рекламная кампания отличается от аукциона / поиска?',
        'answer': 'Если говорить простыми словами, аукцион / поиск — это более точечная работа по конкретным запросам и позициям в поисковой выдаче. Автоматическая рекламная кампания работает шире: она сама подбирает показы на основе карточки, её релевантности и поведения алгоритма. То есть в аукционе ты жёстче управляешь ставками и запросами, а в автоматике больше работаешь через аналитику, чистку нерелевантных показов, качество карточки и общую экономику рекламы.'
    }
]

DEFAULT_CONTENT = {
    'hero_lead': '1,5+ года практического опыта в Wildberries: реклама, SEO, инфографика, поставки, отзывы, логистика и unit-экономика.\nПлюс опыт собственного магазина и автоматизации процессов с помощью ИИ.'
}

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = db()
    cur = conn.cursor()
    cur.execute('CREATE TABLE IF NOT EXISTS faq (id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT NOT NULL, answer TEXT NOT NULL, sort_order INTEGER NOT NULL)')
    cur.execute('CREATE TABLE IF NOT EXISTS gallery_images (id INTEGER PRIMARY KEY AUTOINCREMENT, gallery_id TEXT NOT NULL, filename TEXT NOT NULL, sort_order INTEGER NOT NULL)')
    cur.execute('CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
    cur.execute('SELECT COUNT(*) AS c FROM faq')
    if cur.fetchone()['c'] == 0:
        for idx, item in enumerate(DEFAULT_FAQ):
            cur.execute('INSERT INTO faq(question, answer, sort_order) VALUES (?, ?, ?)', (item['question'], item['answer'], idx))
    for key, value in DEFAULT_CONTENT.items():
        cur.execute('INSERT OR IGNORE INTO site_content(key, value) VALUES (?, ?)', (key, value))
    conn.commit()
    conn.close()


def json_response(handler, code, payload):
    data = json.dumps(payload).encode('utf-8')
    handler.send_response(code)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


def read_json(handler):
    length = int(handler.headers.get('Content-Length', '0'))
    raw = handler.rfile.read(length) if length else b'{}'
    return json.loads(raw.decode('utf-8') or '{}')


def ensure_gallery_dir(gallery_id):
    path = UPLOADS_DIR / gallery_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def file_to_data_url(file_path):
    suffix = file_path.suffix.lower()
    mime = 'image/jpeg'
    if suffix == '.png':
        mime = 'image/png'
    elif suffix == '.webp':
        mime = 'image/webp'
    data = base64.b64encode(file_path.read_bytes()).decode('ascii')
    return f'data:{mime};base64,{data}'


def list_gallery(gallery_id):
    conn = db()
    rows = conn.execute('SELECT filename FROM gallery_images WHERE gallery_id = ? ORDER BY sort_order, id', (gallery_id,)).fetchall()
    conn.close()

    items = []
    for row in rows:
        filename = row['filename'] if isinstance(row, sqlite3.Row) else row[0]
        file_path = UPLOADS_DIR / gallery_id / filename
        if file_path.exists():
            items.append(file_to_data_url(file_path))
    return items


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/gallery-api/list':
            gallery_id = parse_qs(parsed.query).get('id', [''])[0]
            return json_response(self, 200, {'items': list_gallery(gallery_id)})

        if parsed.path == '/faq-api/list':
            conn = db()
            rows = conn.execute('SELECT id, question, answer, sort_order FROM faq ORDER BY sort_order, id').fetchall()
            conn.close()
            return json_response(self, 200, {'items': [dict(row) for row in rows]})

        if parsed.path == '/profile-api':
            profile_path = ROOT / 'profile.jpg'
            if profile_path.exists():
                return json_response(self, 200, {'src': file_to_data_url(profile_path)})
            return json_response(self, 404, {'error': 'Profile image not found'})

        if parsed.path == '/content-api/get':
            key = parse_qs(parsed.query).get('key', [''])[0]
            if not key:
                return json_response(self, 400, {'error': 'Missing key'})
            conn = db()
            row = conn.execute('SELECT value FROM site_content WHERE key = ?', (key,)).fetchone()
            conn.close()
            return json_response(self, 200, {'key': key, 'value': row['value'] if row else ''})

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        data = read_json(self)
        if parsed.path.startswith('/gallery-api/'):
            return self.handle_gallery_api(parsed.path, data)
        if parsed.path.startswith('/faq-api/'):
            return self.handle_faq_api(parsed.path, data)
        if parsed.path.startswith('/content-api/'):
            return self.handle_content_api(parsed.path, data)
        return json_response(self, 404, {'error': 'Not found'})

    def handle_gallery_api(self, path, data):
        gallery_id = ''.join(ch for ch in str(data.get('id', '')) if ch.isalnum() or ch in '_-')
        if not gallery_id:
            return json_response(self, 400, {'error': 'Missing id'})

        conn = db()
        cur = conn.cursor()

        if path == '/gallery-api/upload':
            images = data.get('images') or []
            cur.execute('SELECT COALESCE(MAX(sort_order), -1) FROM gallery_images WHERE gallery_id = ?', (gallery_id,))
            base_order = cur.fetchone()[0] + 1
            gallery_dir = ensure_gallery_dir(gallery_id)
            for i, data_url in enumerate(images):
                if not isinstance(data_url, str) or ',' not in data_url:
                    continue
                header, b64 = data_url.split(',', 1)
                ext = 'jpg'
                if 'image/png' in header:
                    ext = 'png'
                elif 'image/webp' in header:
                    ext = 'webp'
                name = f"{int(__import__('time').time()*1000)}-{i}.{ext}"
                (gallery_dir / name).write_bytes(base64.b64decode(b64))
                cur.execute('INSERT INTO gallery_images(gallery_id, filename, sort_order) VALUES (?, ?, ?)', (gallery_id, name, base_order + i))
            conn.commit()
            conn.close()
            return json_response(self, 200, {'items': list_gallery(gallery_id)})

        if path == '/gallery-api/delete':
            idx = int(data.get('index', -1))
            rows = cur.execute('SELECT id, filename FROM gallery_images WHERE gallery_id = ? ORDER BY sort_order, id', (gallery_id,)).fetchall()
            if 0 <= idx < len(rows):
                row = rows[idx]
                file_path = ensure_gallery_dir(gallery_id) / row['filename']
                if file_path.exists():
                    file_path.unlink()
                cur.execute('DELETE FROM gallery_images WHERE id = ?', (row['id'],))
                for order, item in enumerate(cur.execute('SELECT id FROM gallery_images WHERE gallery_id = ? ORDER BY sort_order, id', (gallery_id,)).fetchall()):
                    cur.execute('UPDATE gallery_images SET sort_order = ? WHERE id = ?', (order, item['id']))
            conn.commit()
            conn.close()
            return json_response(self, 200, {'items': list_gallery(gallery_id)})

        if path == '/gallery-api/clear':
            rows = cur.execute('SELECT filename FROM gallery_images WHERE gallery_id = ?', (gallery_id,)).fetchall()
            for row in rows:
                file_path = ensure_gallery_dir(gallery_id) / row['filename']
                if file_path.exists():
                    file_path.unlink()
            cur.execute('DELETE FROM gallery_images WHERE gallery_id = ?', (gallery_id,))
            conn.commit()
            conn.close()
            return json_response(self, 200, {'items': []})

        if path == '/gallery-api/move':
            idx = int(data.get('index', -1))
            direction = data.get('direction')
            rows = cur.execute('SELECT id, sort_order FROM gallery_images WHERE gallery_id = ? ORDER BY sort_order, id', (gallery_id,)).fetchall()
            if direction == 'left' and 0 < idx < len(rows):
                a, b = rows[idx - 1], rows[idx]
                cur.execute('UPDATE gallery_images SET sort_order = ? WHERE id = ?', (b['sort_order'], a['id']))
                cur.execute('UPDATE gallery_images SET sort_order = ? WHERE id = ?', (a['sort_order'], b['id']))
            if direction == 'right' and 0 <= idx < len(rows) - 1:
                a, b = rows[idx], rows[idx + 1]
                cur.execute('UPDATE gallery_images SET sort_order = ? WHERE id = ?', (b['sort_order'], a['id']))
                cur.execute('UPDATE gallery_images SET sort_order = ? WHERE id = ?', (a['sort_order'], b['id']))
            conn.commit()
            conn.close()
            return json_response(self, 200, {'items': list_gallery(gallery_id)})

        conn.close()
        return json_response(self, 404, {'error': 'Unknown gallery endpoint'})

    def handle_content_api(self, path, data):
        conn = db()
        cur = conn.cursor()

        if path == '/content-api/save':
            key = (data.get('key') or '').strip()
            value = data.get('value') or ''
            if not key:
                conn.close()
                return json_response(self, 400, {'error': 'Missing key'})
            cur.execute('INSERT INTO site_content(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', (key, value))
            conn.commit()
            row = cur.execute('SELECT value FROM site_content WHERE key = ?', (key,)).fetchone()
            conn.close()
            return json_response(self, 200, {'key': key, 'value': row['value'] if row else ''})

        conn.close()
        return json_response(self, 404, {'error': 'Unknown content endpoint'})

    def handle_faq_api(self, path, data):
        conn = db()
        cur = conn.cursor()

        if path == '/faq-api/save':
            faq_id = data.get('id')
            q = (data.get('question') or '').strip()
            a = (data.get('answer') or '').strip()
            if not q or not a:
                conn.close()
                return json_response(self, 400, {'error': 'Missing question or answer'})
            if faq_id is None:
                cur.execute('SELECT COALESCE(MAX(sort_order), -1) FROM faq')
                order = cur.fetchone()[0] + 1
                cur.execute('INSERT INTO faq(question, answer, sort_order) VALUES (?, ?, ?)', (q, a, order))
            else:
                cur.execute('UPDATE faq SET question = ?, answer = ? WHERE id = ?', (q, a, faq_id))
            conn.commit()
        elif path == '/faq-api/delete':
            faq_id = data.get('id')
            cur.execute('DELETE FROM faq WHERE id = ?', (faq_id,))
            rows = cur.execute('SELECT id FROM faq ORDER BY sort_order, id').fetchall()
            for order, row in enumerate(rows):
                cur.execute('UPDATE faq SET sort_order = ? WHERE id = ?', (order, row['id']))
            conn.commit()
        elif path == '/faq-api/move':
            faq_id = data.get('id')
            direction = data.get('direction')
            target_index = data.get('target_index')
            rows = cur.execute('SELECT id, question, answer FROM faq ORDER BY sort_order, id').fetchall()
            items = [dict(r) for r in rows]
            ids = [r['id'] for r in rows]
            if faq_id in ids and items:
                idx = ids.index(faq_id)
                item = items.pop(idx)
                if target_index is not None:
                    try:
                        new_index = max(0, min(len(items), int(target_index)))
                    except Exception:
                        new_index = idx
                    items.insert(new_index, item)
                else:
                    if direction == 'up' and idx > 0:
                        items.insert(idx - 1, item)
                    elif direction == 'down' and idx < len(items):
                        items.insert(idx + 1, item)
                    else:
                        items.insert(idx, item)
                for order, row in enumerate(items):
                    cur.execute('UPDATE faq SET sort_order = ? WHERE id = ?', (order, row['id']))
                conn.commit()
        else:
            conn.close()
            return json_response(self, 404, {'error': 'Unknown faq endpoint'})

        rows = cur.execute('SELECT id, question, answer, sort_order FROM faq ORDER BY sort_order, id').fetchall()
        conn.close()
        return json_response(self, 200, {'items': [dict(row) for row in rows]})


if __name__ == '__main__':
    init_db()
    server = ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    print(f'Serving on http://0.0.0.0:{PORT}')
    server.serve_forever()
