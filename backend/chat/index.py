import json
import os
import urllib.request
import urllib.error


def handler(event: dict, context) -> dict:
    '''
    Business: ИИ-чат Rusty AI — отвечает на любые вопросы по игре Rust (фарм, крафт, рейды, выживание)
    Args: event с httpMethod, body (messages — история диалога)
          context — объект с request_id
    Returns: HTTP-ответ с текстом ответа ассистента
    '''
    method = event.get('httpMethod', 'GET')

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
        }

    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'API key not configured'}),
        }

    body_data = json.loads(event.get('body') or '{}')
    user_messages = body_data.get('messages', [])

    system_prompt = {
        'role': 'system',
        'content': (
            'Ты — Rusty AI, дружелюбный игровой помощник по игре Rust (Facepunch Studios). '
            'Ты отвечаешь ТОЛЬКО по теме игры Rust: фарм ресурсов и скрапа, крафт, рецепты, '
            'изучение (research/workbench), рейды, оружие, базы, мониторы (radtown, аэродром, '
            'военная база), выживание, PvP, электричество, экономика серверов и всё связанное. '
            'Отвечай на ЛЮБОЙ вопрос по игре подробно и по делу, как опытный игрок. '
            'Говори неформально, по-русски, дружелюбно, будто общаешься с тиммейтом. '
            'Если вопрос совсем не про Rust — мягко переведи разговор обратно к игре.'
        ),
    }

    messages = [system_prompt] + [
        {'role': m.get('role', 'user'), 'content': m.get('content', '')}
        for m in user_messages
    ]

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 800,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            result = json.loads(resp.read().decode('utf-8'))
        reply = result['choices'][0]['message']['content']
    except urllib.error.HTTPError as e:
        return {
            'statusCode': 502,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'AI request failed', 'details': e.read().decode('utf-8')}),
        }

    return {
        'statusCode': 200,
        'headers': {**cors_headers, 'Content-Type': 'application/json'},
        'body': json.dumps({'reply': reply}, ensure_ascii=False),
    }
