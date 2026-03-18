const translations = {
  ko: {
    instruments: '종목',
    searchTicker: '티커 검색...',
    searching: '검색 중...',
    noResults: '결과 없음',
    added: '추가됨',
    remove: '삭제',
    allSymbols: '전체',
    newPanel: '+ 새 그룹',
    panelName: '그룹 이름',
    deletePanel: '그룹 삭제',
    date: '일자',
    loading: '차트 로딩 중...',
  },
  en: {
    instruments: 'Instruments',
    searchTicker: 'Search ticker...',
    searching: 'Searching...',
    noResults: 'No results',
    added: 'Added',
    remove: 'Remove',
    allSymbols: 'All',
    newPanel: '+ New Group',
    panelName: 'Group name',
    deletePanel: 'Delete group',
    date: 'Date',
    loading: 'Loading chart...',
  },
}

const LANG_KEY = 'finance-dashboard-lang'

export function loadLang() {
  return localStorage.getItem(LANG_KEY) || 'ko'
}

export function saveLang(lang) {
  localStorage.setItem(LANG_KEY, lang)
}

export function t(lang, key) {
  return translations[lang]?.[key] || translations.en[key] || key
}
