import os
import re
import datetime

# --- 설정 ---
INDEX_HTML_PATH = 'index.html'

def get_latest_market_data():
    """
    Morning Brew, Investing.com 등에서 데이터를 수집하여 딕셔너리로 반환합니다.
    (현 시점에서는 2월 27일 기준 데이터를 기본값으로 반환하며, 
    추후 크롤링 로직을 여기에 확장할 수 있습니다.)
    """
    now = datetime.datetime.now()
    # 목업 데이터 (2026.02.27 기준)
    data = {
        "date": "2026.02.27",
        "weekday": "목",
        "status": "엔비디아 발 차익 실현에 나스닥 하락, AI 과열 경계감 확산",
        "indices": {
            "DOW": {"val": "49,499.2", "change": "+0.03%", "up": True},
            "SP500": {"val": "6,908.8", "change": "-0.54%", "up": False},
            "NASDAQ": {"val": "22,878.3", "change": "-1.18%", "up": False}
        },
        "sectors": [
            {"name": "엔비디아(NVDA)", "val": "-5.0%", "up": False},
            {"name": "넷플릭스(NFLX)", "val": "+11.0%", "up": True},
            {"name": "금융(XLF)", "val": "+1.3%", "up": True},
            {"name": "정보기술(XLK)", "val": "-1.8%", "up": False}
        ],
        "headlines": [
            "🚀 <strong>AI 피로감</strong>: 엔비디아 역대급 실적에도 불구, 고점 부담에 따른 5% 급락",
            "📺 <strong>넷플릭스의 승리</strong>: WBD 인수 철회 소식에 자본 효율성 기대감으로 11% 폭등",
            "💼 <strong>고용 시장</strong>: 신규 실업수당 청구 건수 소폭 증가, 견조한 노동 시장 재확인"
        ],
        "fear_greed": 44,
        "sentiment": "Fear"
    }
    return data

def update_index_html(data):
    if not os.path.exists(INDEX_HTML_PATH):
        print(f"Error: {INDEX_HTML_PATH} not found.")
        return

    with open(INDEX_HTML_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    new_card_html = f'''
            <div id="marketNewsCardArea">
                <div class="news-card">
                    <div class="news-card-header">
                        <div class="header-top">
                            <span class="date-badge">{data['date']} ({data['weekday']})</span>
                            <span style="font-size: 0.8rem; color: #94a3b8;">미국 증시 요약</span>
                        </div>
                        <div class="market-status-title">
                            "{data['status']}"
                        </div>
                    </div>
                    <div class="section-title-line">Market Indices</div>
                    <div class="index-summary-grid">
                        <div class="index-summary-item">
                            <span class="index-summary-name">DOW</span>
                            <span class="index-summary-value">{data['indices']['DOW']['val']}</span>
                            <span class="index-summary-change {'change-up' if data['indices']['DOW']['up'] else 'change-down'}">
                                {'▲' if data['indices']['DOW']['up'] else '▼'} {data['indices']['DOW']['change']}
                            </span>
                        </div>
                        <div class="index-summary-item">
                            <span class="index-summary-name">S&P 500</span>
                            <span class="index-summary-value">{data['indices']['SP500']['val']}</span>
                            <span class="index-summary-change {'change-up' if data['indices']['SP500']['up'] else 'change-down'}">
                                {'▲' if data['indices']['SP500']['up'] else '▼'} {data['indices']['SP500']['change']}
                            </span>
                        </div>
                        <div class="index-summary-item">
                            <span class="index-summary-name">NASDAQ</span>
                            <span class="index-summary-value">{data['indices']['NASDAQ']['val']}</span>
                            <span class="index-summary-change {'change-up' if data['indices']['NASDAQ']['up'] else 'change-down'}">
                                {'▲' if data['indices']['NASDAQ']['up'] else '▼'} {data['indices']['NASDAQ']['change']}
                            </span>
                        </div>
                    </div>
                    <div class="section-title-line">Magnificent 7 & Sectors</div>
                    <div class="sector-summary-list">
                        {''.join([f'<div class="sector-badge-pill" style="border-color: {"#10b981" if s["up"] else "#ef4444"}">{s["name"]} {s["val"]} {"🟢" if s["up"] else "🔴"}</div>' for s in data['sectors']])}
                    </div>
                    <div class="section-title-line">Key Headlines</div>
                    <div class="headline-list-container">
                        {''.join([f'<div class="headline-summary-item">{h}</div>' for h in data['headlines']])}
                    </div>
                    <div class="section-title-line">Market Sentiment</div>
                    <div class="gauge-display-container">
                        <div class="gauge-value-text">{data['fear_greed']} ({data['sentiment']})</div>
                        <div class="gauge-label-text">Fear & Greed Index</div>
                    </div>
                    <div class="news-card-sources">
                        <p>Data Sources:</p>
                        <div class="source-links-list">
                            <a href="https://www.morningbrew.com/issues/latest">Morning Brew</a> | 
                            <a href="https://www.reuters.com/markets/">Reuters</a> | 
                            <a href="https://seekingalpha.com/">Seeking Alpha</a> | 
                            <a href="https://www.investing.com/">Investing.com</a> | 
                            <a href="https://finviz.com/">Finviz</a>
                        </div>
                    </div>
                </div>
            </div>
'''

    pattern = r'(<!-- MARKET_NEWS_CARD_START -->)(.*?)(<!-- MARKET_NEWS_CARD_END -->)'
    if re.search(pattern, content, re.DOTALL):
        updated_content = re.sub(pattern, rf'\1{new_card_html}\3', content, flags=re.DOTALL)
        with open(INDEX_HTML_PATH, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print("Successfully updated index.html with new market news card.")
    else:
        print("Marker <!-- MARKET_NEWS_CARD_START --> not found in index.html")

if __name__ == "__main__":
    market_data = get_latest_market_data()
    update_index_html(market_data)
