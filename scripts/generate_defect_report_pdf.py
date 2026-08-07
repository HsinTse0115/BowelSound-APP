from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    KeepTogether,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "BowelSound_project_defect_report.pdf"


def register_fonts() -> tuple[str, str]:
    candidates = [
        Path(r"C:\Windows\Fonts\NotoSansTC-VF.ttf"),
        Path(r"C:\Windows\Fonts\msyh.ttc"),
        Path(r"C:\Windows\Fonts\mingliu.ttc"),
    ]
    bold_candidates = [
        Path(r"C:\Windows\Fonts\NotoSansTC-VF.ttf"),
        Path(r"C:\Windows\Fonts\msyhbd.ttc"),
        Path(r"C:\Windows\Fonts\mingliub.ttc"),
    ]

    regular = next((p for p in candidates if p.exists()), None)
    bold = next((p for p in bold_candidates if p.exists()), regular)

    if not regular:
        return "Helvetica", "Helvetica-Bold"

    pdfmetrics.registerFont(TTFont("CJKRegular", str(regular)))
    pdfmetrics.registerFont(TTFont("CJKBold", str(bold)))
    return "CJKRegular", "CJKBold"


FONT, FONT_BOLD = register_fonts()


def make_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title",
            parent=base["Title"],
            fontName=FONT_BOLD,
            fontSize=23,
            leading=30,
            textColor=colors.HexColor("#123047"),
            alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            parent=base["Normal"],
            fontName=FONT,
            fontSize=10.5,
            leading=16,
            textColor=colors.HexColor("#5F6F7D"),
            alignment=TA_CENTER,
            spaceAfter=18,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName=FONT_BOLD,
            fontSize=15,
            leading=20,
            textColor=colors.HexColor("#123047"),
            spaceBefore=8,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName=FONT_BOLD,
            fontSize=12.5,
            leading=17,
            textColor=colors.HexColor("#123047"),
            spaceBefore=8,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=9.8,
            leading=15,
            textColor=colors.HexColor("#243746"),
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=8.8,
            leading=13,
            textColor=colors.HexColor("#5F6F7D"),
        ),
        "table_header": ParagraphStyle(
            "table_header",
            parent=base["BodyText"],
            fontName=FONT_BOLD,
            fontSize=8.8,
            leading=12,
            textColor=colors.white,
            alignment=TA_CENTER,
        ),
        "table_cell": ParagraphStyle(
            "table_cell",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=8.2,
            leading=12,
            textColor=colors.HexColor("#243746"),
        ),
        "table_cell_bold": ParagraphStyle(
            "table_cell_bold",
            parent=base["BodyText"],
            fontName=FONT_BOLD,
            fontSize=8.2,
            leading=12,
            textColor=colors.HexColor("#243746"),
        ),
    }


STYLES = make_styles()


def p(text: str, style: str = "body") -> Paragraph:
    return Paragraph(text.replace("\n", "<br/>"), STYLES[style])


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(FONT, 8)
    canvas.setFillColor(colors.HexColor("#7B8994"))
    canvas.drawString(18 * mm, 12 * mm, "BowelSound App project defect report")
    canvas.drawRightString(192 * mm, 12 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_summary_table():
    data = [
        [
            p("優先", "table_header"),
            p("問題", "table_header"),
            p("影響", "table_header"),
            p("改善方向", "table_header"),
        ],
        [
            p("P0", "table_cell_bold"),
            p("分析頁忽略 recordId 參數", "table_cell_bold"),
            p("從採集完成或摘要頁進入分析時，可能顯示第一位病患最新紀錄，而不是使用者點選的紀錄。", "table_cell"),
            p("在 analytics 頁讀取 useLocalSearchParams，依 recordId 尋找紀錄與病患；找不到時顯示錯誤或回退狀態。", "table_cell"),
        ],
        [
            p("P0", "table_cell_bold"),
            p("病患、紀錄、設定未持久化", "table_cell_bold"),
            p("新增資料與設定在 App 重啟後遺失；臨床流程無法累積歷史資料。", "table_cell"),
            p("將 patients、records、settings 寫入 AsyncStorage 或後端；App 啟動時載入並處理版本遷移。", "table_cell"),
        ],
        [
            p("P1", "table_cell_bold"),
            p("根路由 / 語意混亂", "table_cell_bold"),
            p("歡迎頁與 tabs 首頁都對應 /，錄音後 router.replace('/') 可能回到非預期頁面。", "table_cell"),
            p("明確分離 welcome 與 main route；完成後導向 /(tabs) 或 /(tabs)/record，不使用含糊的 /。", "table_cell"),
        ],
        [
            p("P1", "table_cell_bold"),
            p("API URL 設定未被呼叫使用", "table_cell_bold"),
            p("使用者儲存的 API 位址不影響實際 fetch；手機上的 localhost 通常也不是後端。", "table_cell"),
            p("集中建立 apiClient，所有 fetch 都使用 settings.apiUrl；增加 URL 格式驗證與連線測試。", "table_cell"),
        ],
        [
            p("P1", "table_cell_bold"),
            p("未連線仍可開始檢測", "table_cell_bold"),
            p("硬體狀態只在首頁/設定頁顯示，採集頁未納入開始條件，容易產生無效採集。", "table_cell"),
            p("採集頁加入 settings.hardwareConnected 檢查；未連線時禁用開始按鈕並提示連線。", "table_cell"),
        ],
        [
            p("P2", "table_cell_bold"),
            p("摘要統計硬編碼", "table_cell_bold"),
            p("今日採集與待確認訊號固定顯示 3、1，和 records 真實資料不同步。", "table_cell"),
            p("以 records 計算今日筆數、異常/待確認筆數、模型狀態；新增空資料與跨時區測試。", "table_cell"),
        ],
        [
            p("P2", "table_cell_bold"),
            p("表單數值驗證不足", "table_cell_bold"),
            p("年齡、身高、體重可接受部分非法輸入，可能造成錯誤 BMI 或不合理病患資料。", "table_cell"),
            p("改用完整數字驗證與合理範圍限制；送出前正規化輸入並顯示欄位級錯誤。", "table_cell"),
        ],
        [
            p("P3", "table_cell_bold"),
            p("文件與實作不同步", "table_cell_bold"),
            p("文件仍描述舊的 status 型別與 addRecord 參數，會誤導後端或後續前端開發。", "table_cell"),
            p("以 context/AppContext.tsx 為準更新 docs，並補上目前資料欄位與 API 行為。", "table_cell"),
        ],
    ]

    table = Table(data, colWidths=[14 * mm, 36 * mm, 54 * mm, 72 * mm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#123047")),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D5DEE6")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAFC")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def build_details():
    items = [
        (
            "1. 分析頁忽略 recordId 參數",
            "證據：app/(tabs)/record.tsx 會以 params 傳入 recordId；app/(tabs)/explore.tsx 點擊歷史紀錄也傳入 recordId。但 app/analytics.tsx 沒有使用 useLocalSearchParams，只在初始化時選第一位病患與該病患最新紀錄。",
            "改善：在分析頁解析 recordId，先由 records.find 找到對應紀錄，再同步設定 selectedRecord 與 selectedPatient。若 recordId 不存在，顯示「找不到紀錄」並提供返回摘要或重新採集。",
        ),
        (
            "2. 病患、檢測紀錄與設定未持久化",
            "證據：context/AppContext.tsx 只有 userProfile 使用 AsyncStorage；patients、records、settings 均為 useState 預載資料。",
            "改善：建立統一 storage key，例如 @bowelsound_patients、@bowelsound_records、@bowelsound_settings。App 啟動時載入，寫入時做 JSON schema/版本檢查；若未來接後端，Context 應改為本機快取加同步狀態。",
        ),
        (
            "3. 根路由 / 語意混亂",
            "證據：app/index.tsx 是歡迎頁，app/(tabs)/index.tsx 是主系統首頁；Expo typed routes 同時列出 /(tabs) 與 /。錄音結束時 router.replace('/') 容易讓使用者回到不預期頁面。",
            "改善：把歡迎頁改成 /welcome 或只在首次啟動顯示；主系統統一導向 /(tabs)。所有流程完成後使用明確路由，不再使用 / 表達主頁。",
        ),
        (
            "4. API URL 設定未被預留 API 使用",
            "證據：settings.tsx 可以更新 settings.apiUrl，但 patients.tsx、profile.tsx、record.tsx 的 fetch 範例仍硬編碼 http://localhost:8000。",
            "改善：建立 services/api.ts，從 Context 或設定注入 baseUrl；新增 normalizeUrl、timeout、錯誤轉譯與「測試連線」按鈕。行動裝置測試時應使用可連線的 LAN IP 或正式 API 網域。",
        ),
        (
            "5. 硬體連線狀態未限制採集",
            "證據：首頁與設定頁會顯示 settings.hardwareConnected，但 record.tsx 開始按鈕 disabled 條件只有 !selectedPatientId 或 envVolume >= 50。",
            "改善：把 !settings.hardwareConnected 加入禁用條件；未連線時顯示清楚提示並提供前往設定頁的操作。",
        ),
        (
            "6. 摘要統計硬編碼",
            "證據：app/(tabs)/explore.tsx 的 summaryItems 固定為今日採集 3 筆、待確認訊號 1 筆，沒有根據 records 計算。",
            "改善：改成 useMemo 從 records 計算今日資料、異常筆數、最近檢測時間。注意使用本地時區判斷日期，避免 UTC createdAt 造成跨日偏差。",
        ),
        (
            "7. 表單數值驗證不足",
            "證據：patients.tsx 使用 parseInt 驗證年齡；profile.tsx 對年齡、身高、體重沒有完整格式與範圍限制。",
            "改善：使用正則與 Number 驗證完整輸入，例如年齡 1-120、身高 30-250 cm、體重 1-300 kg。BMI 僅在兩欄皆有效時顯示。",
        ),
        (
            "8. 文件與實作不同步",
            "證據：docs/project_detail.md 仍記載 aiResult.status 為 normal | hyper | hypo，且 addRecord 僅接 patientId、duration；實作已改為 normal | abnormal 並包含多個採集參數。",
            "改善：更新 docs/project_detail.md 與 docs/modules/*.md，將文件納入 PR 檢查或 release checklist。",
        ),
    ]

    flowables = [p("詳細問題與改善建議", "h1")]
    for title, evidence, fix in items:
        flowables.append(
            KeepTogether(
                [
                    p(title, "h2"),
                    p(evidence, "body"),
                    p(fix, "body"),
                    Spacer(1, 4),
                ]
            )
        )
    return flowables


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title="BowelSound 專案缺陷與改善建議報告",
        author="Codex",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="default", frames=[frame], onPage=footer)])

    story = [
        p("BowelSound 專案缺陷與改善建議報告", "title"),
        p("檢查範圍：Expo / React Native 前端專案。驗證結果：TypeScript 編譯與 Expo lint 通過；本報告聚焦於功能行為、資料流、路由、設定與文件一致性問題。", "subtitle"),
        p("執行摘要", "h1"),
        p("目前專案沒有編譯級阻斷錯誤，但有多個會影響使用流程與資料可靠性的缺陷。最高優先順序是修正分析頁 recordId 對應與資料持久化，否則使用者完成採集後可能看錯報告，且資料無法在重新啟動後保留。", "body"),
        Spacer(1, 6),
        build_summary_table(),
        PageBreak(),
    ]
    story.extend(build_details())
    story.extend(
        [
            PageBreak(),
            p("建議修正順序", "h1"),
            p("第一階段：修正 analytics 頁 recordId 解析、完成病患/紀錄/設定持久化，並補上最小回歸測試。", "body"),
            p("第二階段：整理路由入口，讓歡迎頁與主系統首頁有明確分工；採集完成後明確導向主系統或分析頁。", "body"),
            p("第三階段：建立 apiClient 並接入 settings.apiUrl；採集頁加入硬體連線狀態限制。", "body"),
            p("第四階段：把摘要統計改為動態計算，強化表單驗證，最後同步更新文件。", "body"),
            Spacer(1, 10),
            p("驗證建議", "h1"),
            p("1. 新增一筆採集紀錄後點擊「查看分析結果」，確認分析頁顯示同一筆 recordId。", "body"),
            p("2. 重啟 App 後確認新增病患、採集紀錄與設定仍存在。", "body"),
            p("3. 將硬體狀態切為未連線，確認採集頁不可開始檢測。", "body"),
            p("4. 修改 API URL 後觸發 API 呼叫，確認實際請求使用新 base URL。", "body"),
            p("5. 輸入非法年齡、身高、體重，確認表單阻擋並顯示欄位錯誤。", "body"),
        ]
    )
    doc.build(story)


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT)
