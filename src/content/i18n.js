// Interface texts. The universe config picks the language with `language: "en" | "tr"`.
// Personal texts (titles, system names, messages) always come from the config itself.

const dictionaries = {
  en: {
    "defaults.title": "Memory Universe",
    "defaults.centerName": "Star of My Life",
    "defaults.enter": "Enter the universe",
    "loading.label": "Gathering memories",
    "story.play": "Play our story",
    "story.stop": "Stop",

    "music.label": "Music controls",
    "music.play": "Play music",
    "music.pause": "Pause music",
    "music.playlist": "Playlist",
    "music.missing": "Song file not found",
    "music.tapToStart": "Tap again to start",
    "music.empty": "Playlist is empty",
    "music.noSongs": "No songs added",

    "nav.label": "Systems",
    "nav.home": "Back to center",
    "nav.reset": "Reset visited memories",
    "nav.resetQuestion": "Mark every memory as unvisited again?",
    "nav.no": "Cancel",
    "nav.yes": "Reset",

    "help.label": "Controls",
    "help.title": "How to explore",
    "help.drag": "Drag",
    "help.scroll": "Scroll",
    "help.pinch": "Pinch",
    "help.clickPhoto": "Click a photo",
    "help.clickCard": "Click the card",
    "help.tapPhoto": "Tap a photo",
    "help.tapCard": "Tap the card",
    "help.look": "Look around",
    "help.zoom": "Zoom",
    "help.open": "Open the memory",
    "help.flip": "Read the note",
    "help.fly": "Fly",
    "help.upDown": "Down / up",
    "help.faster": "Fly faster",
    "help.home": "Back to center",
    "help.nextPrev": "Previous / next memory",
    "help.close": "Close",

    "zone.eyebrow": "System",
    "modal.close": "Close",
    "modal.prev": "Previous memory",
    "modal.next": "Next memory",
    "center.eyebrow": "Center of the Universe",

    "error.title": "Couldn't load the universe",
    "error.check": "Check {folder}/config.js. ({message})",
    "error.unknown": "Unknown error",
    "error.systemId": 'System {number} needs a valid "id" (e.g. "first-date").',
  },

  tr: {
    "defaults.title": "Anı Evreni",
    "defaults.centerName": "Hayatım Yıldızı",
    "defaults.enter": "Evrene giriş yap",
    "loading.label": "Anılar toplanıyor",
    "story.play": "Hikâyemizi oynat",
    "story.stop": "Durdur",

    "music.label": "Müzik kontrolü",
    "music.play": "Müziği başlat",
    "music.pause": "Müziği duraklat",
    "music.playlist": "Şarkı listesi",
    "music.missing": "Şarkı dosyası bekleniyor",
    "music.tapToStart": "Başlatmak için tekrar dokun",
    "music.empty": "Müzik listesi boş",
    "music.noSongs": "Şarkı eklenmedi",

    "nav.label": "Sistemler",
    "nav.home": "Merkeze dön",
    "nav.reset": "Gezilenleri sıfırla",
    "nav.resetQuestion": "Tüm anılar yeniden gezilmemiş sayılsın mı?",
    "nav.no": "Vazgeç",
    "nav.yes": "Sıfırla",

    "help.label": "Kontroller",
    "help.title": "Nasıl gezilir",
    "help.drag": "Sürükle",
    "help.scroll": "Tekerlek",
    "help.pinch": "İki parmak",
    "help.clickPhoto": "Fotoğrafa tıkla",
    "help.clickCard": "Karta tıkla",
    "help.tapPhoto": "Fotoğrafa dokun",
    "help.tapCard": "Karta dokun",
    "help.look": "Etrafa bak",
    "help.zoom": "Yakınlaş",
    "help.open": "Anıyı aç",
    "help.flip": "Notu oku",
    "help.fly": "Uç",
    "help.upDown": "Alçal / yüksel",
    "help.faster": "Daha hızlı uç",
    "help.home": "Merkeze dön",
    "help.nextPrev": "Önceki / sonraki anı",
    "help.close": "Kapat",

    "zone.eyebrow": "Sistem",
    "modal.close": "Kapat",
    "modal.prev": "Önceki anı",
    "modal.next": "Sonraki anı",
    "center.eyebrow": "Evrenin Merkezi",

    "error.title": "Evren yüklenemedi",
    "error.check": "{folder}/config.js dosyasını kontrol et. ({message})",
    "error.unknown": "Bilinmeyen hata",
    "error.systemId": 'Sistem {number} için geçerli bir "id" yazılmalı (ör. "ilk-bulusma").',
  },
};

const FALLBACK_LANGUAGE = "en";

let language = navigator.language?.toLowerCase().startsWith("tr") ? "tr" : FALLBACK_LANGUAGE;

export function setLanguage(value) {
  language = value in dictionaries ? value : FALLBACK_LANGUAGE;
  document.documentElement.lang = language;
}

export function t(key, values = {}) {
  const text = dictionaries[language][key] ?? dictionaries[FALLBACK_LANGUAGE][key] ?? key;

  return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
}

// Fills every [data-i18n] text and [data-i18n-label] aria-label on the page.
export function translatePage(root = document) {
  for (const element of root.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }

  for (const element of root.querySelectorAll("[data-i18n-label]")) {
    element.setAttribute("aria-label", t(element.dataset.i18nLabel));
  }
}
