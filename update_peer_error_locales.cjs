const fs = require('fs');

const paths = {
  vi: './src/locales/vi.json',
  en: './src/locales/en.json',
  es: './src/locales/es.json',
  pt: './src/locales/pt.json',
  ar: './src/locales/ar.json',
  ru: './src/locales/ru.json'
};

const peerErrorTranslations = {
  vi: {
    err_peer_unavailable: "Không tìm thấy thiết bị với mã này. Vui lòng kiểm tra lại mã hoặc máy Phát đã tắt.",
    err_browser_incompatible: "Trình duyệt không hỗ trợ kết nối P2P.",
    err_network: "Lỗi kết nối mạng hoặc máy chủ P2P.",
    err_socket_closed: "Kết nối P2P bị ngắt.",
    err_generic_p2p: "Không thể thiết lập kết nối P2P."
  },
  en: {
    err_peer_unavailable: "Could not connect to this peer code. Please check the code or host status.",
    err_browser_incompatible: "Your browser does not support P2P connection.",
    err_network: "Network error or P2P server connection lost.",
    err_socket_closed: "P2P connection closed.",
    err_generic_p2p: "Failed to establish P2P connection."
  },
  es: {
    err_peer_unavailable: "No se pudo conectar a este código. Verifique el código o el estado del anfitrión.",
    err_browser_incompatible: "Su navegador no admite la conexión P2P.",
    err_network: "Error de red o conexión al servidor P2P perdida.",
    err_socket_closed: "Conexión P2P cerrada.",
    err_generic_p2p: "Error al establecer la conexión P2P."
  },
  pt: {
    err_peer_unavailable: "Não foi possível conectar a este código. Verifique o código ou o status do anfitrião.",
    err_browser_incompatible: "Seu navegador não suporta conexão P2P.",
    err_network: "Erro de rede ou conexão com o servidor P2P perdida.",
    err_socket_closed: "Conexão P2P encerrada.",
    err_generic_p2p: "Falha ao estabelecer conexão P2P."
  },
  ar: {
    err_peer_unavailable: "تعذر الاتصال برمز الجهاز. يرجى التحقق من الرمز أو حالة المضيف.",
    err_browser_incompatible: "متصفحك لا يدعم اتصال P2P.",
    err_network: "خطأ في الشبكة أو فقدان الاتصال بخادم P2P.",
    err_socket_closed: "تم إغلاق اتصال P2P.",
    err_generic_p2p: "فشل في إنشاء اتصال P2P."
  },
  ru: {
    err_peer_unavailable: "Не удалось подключиться к этому коду. Проверьте код или статус хоста.",
    err_browser_incompatible: "Ваш браузер не поддерживает P2P-соединение.",
    err_network: "Ошибка сети или потеряно соединение с P2P-сервером.",
    err_socket_closed: "P2P-соединение закрыто.",
    err_generic_p2p: "Не удалось установить P2P-соединение."
  }
};

for (const [lang, path] of Object.entries(paths)) {
  const json = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (!json.sync) json.sync = {};
  Object.assign(json.sync, peerErrorTranslations[lang]);
  fs.writeFileSync(path, JSON.stringify(json, null, 2), 'utf8');
}

console.log('Peer error locales updated successfully!');
