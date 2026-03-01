import os
import re
import html as html_lib
import datetime
import urllib.request
import xml.etree.ElementTree as ET

try:
    from deep_translator import GoogleTranslator
    def translate_ko(text):
        if not text:
            return text
        try:
            return GoogleTranslator(source='auto', target='ko').translate(text[:500]) or text
        except Exception:
            return text
except ImportError:
    def translate_ko(text):
        return text

# --- 설정 ---
INDEX_HTML_PATH = 'index.html'

MONTH_MAP = {
    'Jan':'01','Feb':'02','Mar':'03','Apr':'04','May':'05','Jun':'06',
    'Jul':'07','Aug':'08','Sep':'09','Oct':'10','Nov':'11','Dec':'12'
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def esc(text):
    return html_lib.escape(str(text))

def parse_rfc2822_date(pub):
    """'Sun, 01 Mar 2026 10:41:50 +0900' → '2026-03-01'"""
    try:
        parts = pub.strip().split()
        if len(parts) >= 4:
            d, m, y = parts[1], parts[2], parts[3]
            return f"{y}-{MONTH_MAP.get(m, m)}-{d.zfill(2)}"
    except Exception:
        pass
    return ''

def truncate(text, n=90):
    text = re.sub(r'\s+', ' ', text).strip()
    return (text[:n] + '...') if len(text) > n else text

# ─── 뉴스 수집 ────────────────────────────────────────────────────────────────

def fetch_rss_news(url, count, source_name, source_url, do_translate=False):
    """범용 RSS 뉴스 수집 함수"""
    arts = []
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as r:
            root = ET.fromstring(r.read())
        for item in root.findall('.//item')[:count]:
            title = (item.findtext('title') or '').strip()
            link  = (item.findtext('link')  or '').strip()
            desc  = truncate((item.findtext('description') or '').strip())
            date  = parse_rfc2822_date(item.findtext('pubDate') or '')
            if title and link:
                arts.append({
                    'title': translate_ko(title) if do_translate else title,
                    'link': link, 'desc': desc, 'date': date,
                    'source': source_name, 'source_url': source_url
                })
        print(f"[{source_name}] {len(arts)}건 로드")
    except Exception as e:
        print(f"[{source_name}] 실패: {e}")
    return arts

def get_yahoo_finance_news(count=3):
    """Yahoo Finance RSS — 영어 기사 (한국어 번역)"""
    return fetch_rss_news(
        "https://finance.yahoo.com/news/rssindex", count,
        "Yahoo Finance", "https://finance.yahoo.com", do_translate=True
    )

def get_cnbc_news(count=3):
    """CNBC Markets RSS — 영어 기사 (한국어 번역)"""
    return fetch_rss_news(
        "https://www.cnbc.com/id/10000664/device/rss/rss.html", count,
        "CNBC", "https://www.cnbc.com/markets/", do_translate=True
    )

def get_marketwatch_news(count=3):
    """MarketWatch RSS — 영어 기사 (한국어 번역)"""
    return fetch_rss_news(
        "https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines", count,
        "MarketWatch", "https://www.marketwatch.com", do_translate=True
    )

def build_news_items_html(arts, border='rgba(250,204,21,0.5)'):
    if not arts:
        return "<p style='color:#f87171;font-size:0.85em;margin:0;'>기사를 불러올 수 없습니다.</p>"
    out = ''
    for a in arts:
        desc_html = (
            f"<p style='color:#94a3b8;font-size:0.78em;margin:3px 0 0;line-height:1.5;'>{esc(a['desc'])}</p>"
        ) if a.get('desc') else ''
        meta_parts = []
        if a.get('date'):
            meta_parts.append(esc(a['date']))
        if a.get('source'):
            meta_parts.append(
                f"출처: <a href='{esc(a.get('source_url', '#'))}' target='_blank' rel='noopener'"
                f" style='color:#94a3b8;text-decoration:underline;'>{esc(a['source'])}</a>"
            )
        meta_html = (
            f"<span style='color:#64748b;font-size:0.72em;display:block;margin-top:3px;'>"
            f"{'  ·  '.join(meta_parts)}</span>"
        ) if meta_parts else ''
        out += (
            f"<div style='margin-bottom:9px;padding:9px 10px;"
            f"background:rgba(0,0,0,0.2);border-left:3px solid {border};"
            f"border-radius:0 6px 6px 0;'>"
            f"<a href='{esc(a['link'])}' target='_blank' rel='noopener'"
            f" style='color:#f8fafc;text-decoration:none;font-size:0.87em;"
            f"font-weight:600;line-height:1.4;display:block;'>{esc(a['title'])}</a>"
            f"{meta_html}{desc_html}</div>"
        )
    return out

# ─── HTML 업데이트 ────────────────────────────────────────────────────────────

def update_index_html():
    if not os.path.exists(INDEX_HTML_PATH):
        print(f"파일 없음: {INDEX_HTML_PATH}")
        return

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    now_kst = now_utc + datetime.timedelta(hours=9)
    updated_time = now_kst.strftime("%H:%M")

    # 뉴스 수집 (3 소스 × 3 기사 = 9개)
    yahoo_arts       = get_yahoo_finance_news(3)
    cnbc_arts        = get_cnbc_news(3)
    marketwatch_arts = get_marketwatch_news(3)

    # HTML 생성
    yahoo_html       = build_news_items_html(yahoo_arts,       border='rgba(250,204,21,0.5)')
    cnbc_html        = build_news_items_html(cnbc_arts,        border='rgba(56,189,248,0.5)')
    marketwatch_html = build_news_items_html(marketwatch_arts, border='rgba(74,222,128,0.5)')

    right_card_content = f'''
                        <div class="news-card-header">
                            <div class="header-top">
                                <span class="date-badge" style="background:rgba(56,189,248,0.15);color:#38bdf8;">글로벌 마켓 뉴스</span>
                                <span style="font-size:0.9rem;color:#94a3b8;">Updated: {updated_time} KST</span>
                                <button onclick="window.location.reload()" title="새로고침" style="margin-left:auto;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#94a3b8;font-size:0.8rem;padding:3px 10px;border-radius:6px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.15)';this.style.color='#f8fafc'" onmouseout="this.style.background='rgba(255,255,255,0.08)';this.style.color='#94a3b8'">&#x27F3; 새로고침</button>
                            </div>
                            <div class="market-status-title" style="margin-top:10px;">&#127758; 실시간 글로벌 시장 뉴스</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <strong style="color:#facc15;font-size:0.82em;display:block;margin-bottom:8px;letter-spacing:0.03em;border-bottom:1px solid rgba(250,204,21,0.2);padding-bottom:4px;">&#128202; Yahoo Finance</strong>
                            {yahoo_html}
                        </div>
                        <div style="margin-bottom:14px;">
                            <strong style="color:#38bdf8;font-size:0.82em;display:block;margin-bottom:8px;letter-spacing:0.03em;border-bottom:1px solid rgba(56,189,248,0.2);padding-bottom:4px;">&#128250; CNBC Markets</strong>
                            {cnbc_html}
                        </div>
                        <div>
                            <strong style="color:#4ade80;font-size:0.82em;display:block;margin-bottom:8px;letter-spacing:0.03em;border-bottom:1px solid rgba(74,222,128,0.2);padding-bottom:4px;">&#128240; MarketWatch</strong>
                            {marketwatch_html}
                        </div>
    '''

    with open(INDEX_HTML_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # 오른쪽 카드만 업데이트 (LEFT_CARD는 TradingView 위젯 유지)
    pattern = r'(<!-- RIGHT_CARD_START -->)(.*?)(<!-- RIGHT_CARD_END -->)'
    if not re.search(pattern, content, re.DOTALL):
        print("RIGHT_CARD 마커를 찾을 수 없습니다.")
        return

    updated = re.sub(
        pattern,
        rf'\1{right_card_content}\3',
        content, flags=re.DOTALL
    )

    with open(INDEX_HTML_PATH, 'w', encoding='utf-8') as f:
        f.write(updated)
    print("index.html 오른쪽 뉴스 카드 업데이트 완료.")


if __name__ == "__main__":
    update_index_html()
