import os
import re
import datetime

# --- 설정 ---
INDEX_HTML_PATH = 'index.html'

def get_latest_market_data():
    """
    Morning Brew, Investing.com 등에서 데이터를 수집하여 딕셔너리로 반환합니다.
    이미지 레퍼런스(2월 27일) 데이터를 기반으로 상세화된 데이터를 반환합니다.
    """
    now = datetime.datetime.now()
    # 목업 데이터 (첨부 이미지 레퍼런스 반영)
    data = {
        "date": "2026.02.27",
        "weekday": "목",
        "main_title": "미증시 동향",
        "status_lines": [
            "엔비디아 부진에 나스닥 하락 📉",
            "미-이란 이슈로 낙폭 축소 🤔"
        ],
        "night_summary": [
            "혼조세 마감: NVIDIA 실적 후 기술주 랠리 주춤, 투심 위축 😟",
            "기술주 변동성 확대: AI 투자 비용 & 산업 재편 우려 속에 불확실성 지속 🏗️",
            "NVIDIA 급락 나스닥 하락 주도: 실적 상회에도 성장 둔화 & 높은 기대치 부담 😥",
            "순환매 움직임: 경기민감 업종으로 자금 이동 🔄",
            "시장 주목: 향후 실적과 수요가 높은 기대치를 충족할지 여부 👀"
        ],
        "indices": [
            {"name": "DOW", "val": "+0.03%", "up": True, "icon": "🇺🇸"},
            {"name": "S&P500", "val": "-0.54%", "up": False, "icon": "🌍"},
            {"name": "Nasdaq", "val": "-1.18%", "up": False, "icon": "📉"},
            {"name": "Russell2000", "val": "+0.58%", "up": True, "icon": "🏢"},
            {"name": "필라델피아 반도체", "val": "-3.19%", "up": False, "icon": "⚡"},
            {"name": "VIX", "val": "+4.13%", "up": False, "icon": "📈"} # VIX 상승은 시장에 부정적
        ],
        "sectors": {
            "top": [
                {"name": "Financial", "val": "+1.21%", "up": True},
                {"name": "Industrials", "val": "+0.63%", "up": True},
                {"name": "Real Estate", "val": "+0.46%", "up": True},
                {"name": "Energy", "val": "+0.33%", "up": True},
                {"name": "Comm. Services", "val": "+0.19%", "up": True}
            ],
            "bottom": [
                {"name": "Technology", "val": "-1.40%", "up": False},
                {"name": "Utilities", "val": "-0.42%", "up": False},
                {"name": "Healthcare", "val": "-0.26%", "up": False},
                {"name": "Cons. Defensive", "val": "-0.17%", "up": False},
                {"name": "Basic Materials", "val": "-0.11%", "up": False}
            ]
        },
        "nvidia": {
            "name": "NVIDIA",
            "change": "-5.49%",
            "desc": "전일 정규장 마감 후 예상 상외 실적 & 가이던스 제시했음에도 실적/가이던스가 시장 기대치 대비 크게 높지 않다는 점 부각 😥"
        },
        "bigtech": [
            {"name": "Apple", "val": "-0.47%", "up": False},
            {"name": "Microsoft", "val": "+0.28%", "up": True},
            {"name": "Alphabet", "val": "-1.88%", "up": False},
            {"name": "Amazon", "val": "-1.29%", "up": False},
            {"name": "Tesla", "val": "-2.11%", "up": False},
            {"name": "Meta", "val": "+0.51%", "up": True}
        ],
        "etfs": [
            "📌 MSCI 한국 증시 ETF : 미 증시 부진에도 전일 KOSPI 급등으로 1.02% 상승 🇰🇷",
            "📌 MSCI 신흥지수 ETF : 0.95% 하락 🌍"
        ]
    }
    return data

def update_index_html(data):
    if not os.path.exists(INDEX_HTML_PATH):
        print(f"Error: {INDEX_HTML_PATH} not found.")
        return

    with open(INDEX_HTML_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # 인포그래픽 스타일 템플릿
    status_html = "".join([f'<div>{line}</div>' for line in data['status_lines']])
    night_html = "".join([f'<li>{line}</li>' for line in data['night_summary']])
    indices_html = "".join([
        f'<div class="index-box"><span class="index-name-box">{idx["icon"]} {idx["name"]}</span> <span class="{"change-up" if idx["up"] else "change-down"}">{idx["val"]}</span></div>'
        for idx in data['indices']
    ])
    
    sector_rows = ""
    for i in range(max(len(data['sectors']['top']), len(data['sectors']['bottom']))):
        t = data['sectors']['top'][i] if i < len(data['sectors']['top']) else {"name": "", "val": ""}
        b = data['sectors']['bottom'][i] if i < len(data['sectors']['bottom']) else {"name": "", "val": ""}
        sector_rows += f'''
            <tr>
                <td style="width:50%"><div class="sector-name-cell"><div class="color-dot" style="background:#059669"></div>{t['name']} <span class="change-up">{t['val']}</span></div></td>
                <td style="width:50%"><div class="sector-name-cell"><div class="color-dot" style="background:#dc2626"></div>{b['name']} <span class="change-down">{b['val']}</span></div></td>
            </tr>
        '''

    bigtech_html = "".join([
        f'<div class="index-box" style="border:none; background:none; font-size:0.95rem;"><span>{b["name"]}</span> <span class="{"change-up" if b["up"] else "change-down"}">{b["val"]}</span></div>'
        for b in data['bigtech']
    ])

    etf_html = "".join([f'<div style="margin-bottom:8px; font-size:0.95rem;">{e}</div>' for e in data['etfs']])

    new_card_html = f'''
            <div id="marketNewsCardArea">
                <div class="news-card">
                    <link href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap" rel="stylesheet">
                    <div class="news-card-header">
                        <div class="header-main-title">{data['main_title']} ({data['date']})</div>
                        <div class="market-status-title">
                            {status_html}
                        </div>
                    </div>

                    <div class="section-container">
                        <div class="section-header">🌙 밤사이 미국 증시 🐻</div>
                        <ul class="headline-bullet">
                            {night_html}
                        </ul>
                    </div>

                    <div class="index-grid-wrapper" style="margin-bottom:25px;">
                        {indices_html}
                    </div>

                    <div class="section-container">
                        <div class="section-header">📊 S&P500 섹터별 등락</div>
                        <table class="sector-table">
                            {sector_rows}
                        </table>
                    </div>

                    <div class="big-highlight-box">
                        <div style="font-size:1.4rem; font-weight:800;">{data['nvidia']['name']} <span class="change-down">{data['nvidia']['change']} 📉</span></div>
                        <div style="font-size:0.95rem; width:65%; line-height:1.4;">{data['nvidia']['desc']}</div>
                    </div>

                    <div class="section-container">
                        <div class="section-header">💻 빅테크 7</div>
                        <div class="index-grid-wrapper">
                            {bigtech_html}
                        </div>
                    </div>

                    <div class="section-container" style="border:none; background:#f0f9ff;">
                        <div class="section-header">Other ETFs 🌏</div>
                        {etf_html}
                    </div>

                    <div class="news-card-sources">
                        <p>Data Sources: Morning Brew, Reuters, Investing.com</p>
                    </div>
                </div>
            </div>
'''

    pattern = r'(<!-- MARKET_NEWS_CARD_START -->)(.*?)(<!-- MARKET_NEWS_CARD_END -->)'
    if re.search(pattern, content, re.DOTALL):
        updated_content = re.sub(pattern, rf'\1{new_card_html}\3', content, flags=re.DOTALL)
        with open(INDEX_HTML_PATH, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print("Successfully updated index.html with infographic market news card.")
    else:
        print("Marker <!-- MARKET_NEWS_CARD_START --> not found in index.html")

if __name__ == "__main__":
    market_data = get_latest_market_data()
    update_index_html(market_data)
