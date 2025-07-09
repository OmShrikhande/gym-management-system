/**
 * Translation utility for the application
 * Supports multiple languages and provides translation functions
 */

// English translations (default)
const en = {
  // Common
  dashboard: "Dashboard",
  settings: "Settings",
  save: "Save",
  cancel: "Cancel",
  loading: "Loading...",
  success: "Success",
  error: "Error",
  refresh: "Refresh",
  profile: "Profile",
  logout: "Log out",
  subscriptionActive: "Subscription Active",
  
  // Navigation
  navigation: "Navigation",
  home: "Home",
  members: "Members",
  trainers: "Trainers",
  membershipPlans: "Membership Plans",
  workouts: "Workouts",
  dietPlans: "Diet Plans",
  billing: "Billing & Plans",
  reports: "Reports",
  systemSettings: "System Settings",
  gymManagement: "Gym Management",
  userManagement: "User Management",

  enquiries: "Enquiries",
  messages: "Messages",
  
  // Settings
  globalSettings: "Global Settings",
  branding: "Branding & Appearance",
  notifications: "Notifications",
  messageTemplates: "Message Templates",
  integrations: "Integrations",
  configureSettings: "Configure global and gym-specific settings",
  saveAllChanges: "Save All Changes",
  settingsSaved: "Settings saved successfully",
  
  // Settings - Global
  appName: "Application Name",
  defaultCurrency: "Default Currency",
  defaultLanguage: "Default Language",
  defaultTimezone: "Default Timezone",
  dateFormat: "Date Format",
  timeFormat: "Time Format",
  
  // Settings - Branding
  primaryColor: "Primary Color (Buttons, Links)",
  secondaryColor: "Secondary Color (Accents)",
  backgroundColor: "Background Color",
  cardColor: "Card Background Color",
  sidebarColor: "Sidebar Color",
  textColor: "Text Color",
  darkMode: "Dark Mode",
  logoUrl: "Logo URL",
  faviconUrl: "Favicon URL",
  customCss: "Custom CSS",
  
  // Access
  accessDenied: "Access Denied",
  noPermission: "You don't have permission to access system settings.",
  adminOnlyAccess: "Only Super Admins and Gym Owners can manage these settings.",
  goBack: "Go Back",
  
  // Membership
  membershipExpired: "Membership Expired",
  renewMembership: "Renew Membership",
  membershipExpiredMessage: "Your membership has expired. Please renew to continue accessing the dashboard.",
  member: "Member",
  membershipEndDate: "Your membership expired on",
  
  // Currencies
  usd: "USD - US Dollar",
  eur: "EUR - Euro",
  inr: "INR - Indian Rupee",
  gbp: "GBP - British Pound",
  cad: "CAD - Canadian Dollar",
  aud: "AUD - Australian Dollar",
  jpy: "JPY - Japanese Yen",
  cny: "CNY - Chinese Yuan",
};

// Spanish translations
const es = {
  // Common
  dashboard: "Panel de Control",
  settings: "Configuración",
  save: "Guardar",
  cancel: "Cancelar",
  loading: "Cargando...",
  success: "Éxito",
  error: "Error",
  refresh: "Actualizar",
  profile: "Perfil",
  logout: "Cerrar sesión",
  subscriptionActive: "Suscripción Activa",
  
  // Navigation
  navigation: "Navegación",
  home: "Inicio",
  members: "Miembros",
  trainers: "Entrenadores",
  workouts: "Entrenamientos",
  dietPlans: "Planes de Dieta",
  billing: "Facturación y Planes",
  reports: "Informes",
  systemSettings: "Configuración del Sistema",
  gymManagement: "Gestión de Gimnasios",
  userManagement: "Gestión de Usuarios",
  
  // Settings
  globalSettings: "Configuración Global",
  branding: "Marca y Apariencia",
  notifications: "Notificaciones",
  messageTemplates: "Plantillas de Mensajes",
  integrations: "Integraciones",
  configureSettings: "Configurar ajustes globales y específicos del gimnasio",
  saveAllChanges: "Guardar Todos los Cambios",
  settingsSaved: "Configuración guardada con éxito",
  
  // Settings - Global
  appName: "Nombre de la Aplicación",
  defaultCurrency: "Moneda Predeterminada",
  defaultLanguage: "Idioma Predeterminado",
  defaultTimezone: "Zona Horaria Predeterminada",
  dateFormat: "Formato de Fecha",
  timeFormat: "Formato de Hora",
  
  // Settings - Branding
  primaryColor: "Color Primario (Botones, Enlaces)",
  secondaryColor: "Color Secundario (Acentos)",
  backgroundColor: "Color de Fondo",
  cardColor: "Color de Fondo de Tarjeta",
  sidebarColor: "Color de Barra Lateral",
  textColor: "Color de Texto",
  darkMode: "Modo Oscuro",
  logoUrl: "URL del Logo",
  faviconUrl: "URL del Favicon",
  customCss: "CSS Personalizado",
  
  // Access
  accessDenied: "Acceso Denegado",
  noPermission: "No tienes permiso para acceder a la configuración del sistema.",
  adminOnlyAccess: "Solo los Super Administradores y Propietarios de Gimnasios pueden gestionar esta configuración.",
  goBack: "Volver",
  
  // Membership
  membershipExpired: "Membresía Expirada",
  renewMembership: "Renovar Membresía",
  membershipExpiredMessage: "Tu membresía ha expirado. Por favor renueva para seguir accediendo al panel de control.",
  member: "Miembro",
  membershipEndDate: "Tu membresía expiró el",
  
  // Currencies
  usd: "USD - Dólar Estadounidense",
  eur: "EUR - Euro",
  inr: "INR - Rupia India",
  gbp: "GBP - Libra Esterlina",
  cad: "CAD - Dólar Canadiense",
  aud: "AUD - Dólar Australiano",
  jpy: "JPY - Yen Japonés",
  cny: "CNY - Yuan Chino",
};

// Hindi translations
const hi = {
  // Common
  dashboard: "डैशबोर्ड",
  settings: "सेटिंग्स",
  save: "सहेजें",
  cancel: "रद्द करें",
  loading: "लोड हो रहा है...",
  success: "सफलता",
  error: "त्रुटि",
  refresh: "रीफ्रेश",
  profile: "प्रोफाइल",
  logout: "लॉग आउट",
  subscriptionActive: "सदस्यता सक्रिय",
  
  // Navigation
  navigation: "नेविगेशन",
  home: "होम",
  members: "सदस्य",
  trainers: "प्रशिक्षक",
  workouts: "व्यायाम",
  dietPlans: "आहार योजना",
  billing: "बिलिंग और प्लान",
  reports: "रिपोर्ट",
  systemSettings: "सिस्टम सेटिंग्स",
  gymManagement: "जिम प्रबंधन",
  userManagement: "उपयोगकर्ता प्रबंधन",
  
  // Settings
  globalSettings: "वैश्विक सेटिंग्स",
  branding: "ब्रांडिंग और दिखावट",
  notifications: "सूचनाएं",
  messageTemplates: "संदेश टेम्पलेट",
  integrations: "एकीकरण",
  configureSettings: "वैश्विक और जिम-विशिष्ट सेटिंग्स कॉन्फ़िगर करें",
  saveAllChanges: "सभी परिवर्तन सहेजें",
  settingsSaved: "सेटिंग्स सफलतापूर्वक सहेजी गईं",
  
  // Settings - Global
  appName: "एप्लिकेशन का नाम",
  defaultCurrency: "डिफ़ॉल्ट मुद्रा",
  defaultLanguage: "डिफ़ॉल्ट भाषा",
  defaultTimezone: "डिफ़ॉल्ट समय क्षेत्र",
  dateFormat: "दिनांक प्रारूप",
  timeFormat: "समय प्रारूप",
  
  // Settings - Branding
  primaryColor: "प्राथमिक रंग (बटन, लिंक)",
  secondaryColor: "द्वितीयक रंग (एक्सेंट)",
  backgroundColor: "पृष्ठभूमि का रंग",
  cardColor: "कार्ड पृष्ठभूमि का रंग",
  sidebarColor: "साइडबार का रंग",
  textColor: "टेक्स्ट का रंग",
  darkMode: "डार्क मोड",
  logoUrl: "लोगो URL",
  faviconUrl: "फेविकॉन URL",
  customCss: "कस्टम CSS",
  
  // Access
  accessDenied: "पहुंच अस्वीकृत",
  noPermission: "आपके पास सिस्टम सेटिंग्स तक पहुंचने की अनुमति नहीं है।",
  adminOnlyAccess: "केवल सुपर एडमिन और जिम मालिक ही इन सेटिंग्स को प्रबंधित कर सकते हैं।",
  goBack: "वापस जाएं",
  
  // Membership
  membershipExpired: "सदस्यता समाप्त हो गई",
  renewMembership: "सदस्यता नवीनीकरण करें",
  membershipExpiredMessage: "आपकी सदस्यता समाप्त हो गई है। डैशबोर्ड तक पहुंच जारी रखने के लिए कृपया नवीनीकरण करें।",
  member: "सदस्य",
  membershipEndDate: "आपकी सदस्यता समाप्त हो गई",
  
  // Currencies
  usd: "USD - अमेरिकी डॉलर",
  eur: "EUR - यूरो",
  inr: "INR - भारतीय रुपया",
  gbp: "GBP - ब्रिटिश पाउंड",
  cad: "CAD - कनाडाई डॉलर",
  aud: "AUD - ऑस्ट्रेलियाई डॉलर",
  jpy: "JPY - जापानी येन",
  cny: "CNY - चीनी युआन",
};

// French translations
const fr = {
  // Common
  dashboard: "Tableau de Bord",
  settings: "Paramètres",
  save: "Enregistrer",
  cancel: "Annuler",
  loading: "Chargement...",
  success: "Succès",
  error: "Erreur",
  refresh: "Actualiser",
  profile: "Profil",
  logout: "Déconnexion",
  subscriptionActive: "Abonnement Actif",
  
  // Navigation
  navigation: "Navigation",
  home: "Accueil",
  members: "Membres",
  trainers: "Entraîneurs",
  workouts: "Entraînements",
  dietPlans: "Plans Alimentaires",
  billing: "Facturation et Plans",
  reports: "Rapports",
  systemSettings: "Paramètres Système",
  gymManagement: "Gestion des Salles",
  userManagement: "Gestion des Utilisateurs",
  
  // Settings
  globalSettings: "Paramètres Globaux",
  branding: "Marque et Apparence",
  notifications: "Notifications",
  messageTemplates: "Modèles de Messages",
  integrations: "Intégrations",
  configureSettings: "Configurer les paramètres globaux et spécifiques à la salle",
  saveAllChanges: "Enregistrer Tous les Changements",
  settingsSaved: "Paramètres enregistrés avec succès",
  
  // Settings - Global
  appName: "Nom de l'Application",
  defaultCurrency: "Devise par Défaut",
  defaultLanguage: "Langue par Défaut",
  defaultTimezone: "Fuseau Horaire par Défaut",
  dateFormat: "Format de Date",
  timeFormat: "Format d'Heure",
  
  // Settings - Branding
  primaryColor: "Couleur Primaire (Boutons, Liens)",
  secondaryColor: "Couleur Secondaire (Accents)",
  backgroundColor: "Couleur d'Arrière-plan",
  cardColor: "Couleur d'Arrière-plan des Cartes",
  sidebarColor: "Couleur de la Barre Latérale",
  textColor: "Couleur du Texte",
  darkMode: "Mode Sombre",
  logoUrl: "URL du Logo",
  faviconUrl: "URL du Favicon",
  customCss: "CSS Personnalisé",
  
  // Access
  accessDenied: "Accès Refusé",
  noPermission: "Vous n'avez pas la permission d'accéder aux paramètres système.",
  adminOnlyAccess: "Seuls les Super Administrateurs et les Propriétaires de Salle peuvent gérer ces paramètres.",
  goBack: "Retour",
  
  // Membership
  membershipExpired: "Adhésion Expirée",
  renewMembership: "Renouveler l'Adhésion",
  membershipExpiredMessage: "Votre adhésion a expiré. Veuillez la renouveler pour continuer à accéder au tableau de bord.",
  member: "Membre",
  membershipEndDate: "Votre adhésion a expiré le",
  
  // Currencies
  usd: "USD - Dollar Américain",
  eur: "EUR - Euro",
  inr: "INR - Roupie Indienne",
  gbp: "GBP - Livre Sterling",
  cad: "CAD - Dollar Canadien",
  aud: "AUD - Dollar Australien",
  jpy: "JPY - Yen Japonais",
  cny: "CNY - Yuan Chinois",
};
// Chinese (Simplified) translations
const zh = {
  // Common
  dashboard: "仪表盘",
  settings: "设置",
  save: "保存",
  cancel: "取消",
  loading: "加载中...",
  success: "成功",
  error: "错误",
  refresh: "刷新",
  profile: "个人资料",
  logout: "退出登录",
  subscriptionActive: "订阅已激活",
  
  // Navigation
  navigation: "导航",
  home: "首页",
  members: "会员",
  trainers: "教练",
  workouts: "锻炼",
  dietPlans: "饮食计划",
  billing: "账单与计划",
  reports: "报告",
  systemSettings: "系统设置",
  gymManagement: "健身房管理",
  userManagement: "用户管理",
  
  // Settings
  globalSettings: "全局设置",
  branding: "品牌与外观",
  notifications: "通知",
  messageTemplates: "消息模板",
  integrations: "集成",
  configureSettings: "配置全局和健身房特定设置",
  saveAllChanges: "保存所有更改",
  settingsSaved: "设置已成功保存",
  
  // Settings - Global
  appName: "应用程序名称",
  defaultCurrency: "默认货币",
  defaultLanguage: "默认语言",
  defaultTimezone: "默认时区",
  dateFormat: "日期格式",
  timeFormat: "时间格式",
  
  // Settings - Branding
  primaryColor: "主颜色（按钮、链接）",
  secondaryColor: "次颜色（装饰）",
  backgroundColor: "背景颜色",
  cardColor: "卡片背景颜色",
  sidebarColor: "侧边栏颜色",
  textColor: "文本颜色",
  darkMode: "暗黑模式",
  logoUrl: "标志 URL",
  faviconUrl: "网站图标 URL",
  customCss: "自定义 CSS",
  
  // Access
  accessDenied: "访问被拒绝",
  noPermission: "您无权访问系统设置。",
  adminOnlyAccess: "仅超级管理员和健身房所有者可以管理这些设置。",
  goBack: "返回",
  
  // Membership
  membershipExpired: "会员资格已过期",
  renewMembership: "续订会员资格",
  membershipExpiredMessage: "您的会员资格已过期。请续订以继续访问仪表盘。",
  member: "会员",
  membershipEndDate: "您的会员资格已过期",
  
  // Currencies
  usd: "USD - 美元",
  eur: "EUR - 欧元",
  inr: "INR - 印度卢比",
  gbp: "GBP - 英镑",
  cad: "CAD - 加拿大元",
  aud: "AUD - 澳大利亚元",
  jpy: "JPY - 日元",
  cny: "CNY - 人民币",
};

// Japanese translations
const ja = {
  // Common
  dashboard: "ダッシュボード",
  settings: "設定",
  save: "保存",
  cancel: "キャンセル",
  loading: "読み込み中...",
  success: "成功",
  error: "エラー",
  refresh: "更新",
  profile: "プロフィール",
  logout: "ログアウト",
  subscriptionActive: "サブスクリプション有効",
  
  // Navigation
  navigation: "ナビゲーション",
  home: "ホーム",
  members: "メンバー",
  trainers: "トレーナー",
  workouts: "ワークアウト",
  dietPlans: "食事プラン",
  billing: "請求とプラン",
  reports: "レポート",
  systemSettings: "システム設定",
  gymManagement: "ジム管理",
  userManagement: "ユーザー管理",
  
  // Settings
  globalSettings: "グローバル設定",
  branding: "ブランディングと外観",
  notifications: "通知",
  messageTemplates: "メッセージテンプレート",
  integrations: "統合",
  configureSettings: "グローバルおよびジム固有の設定を構成",
  saveAllChanges: "すべての変更を保存",
  settingsSaved: "設定が正常に保存されました",
  
  // Settings - Global
  appName: "アプリケーション名",
  defaultCurrency: "デフォルト通貨",
  defaultLanguage: "デフォルト言語",
  defaultTimezone: "デフォルトタイムゾーン",
  dateFormat: "日付形式",
  timeFormat: "時間形式",
  
  // Settings - Branding
  primaryColor: "プライマリーカラー（ボタン、リンク）",
  secondaryColor: "セカンダリーカラー（アクセント）",
  backgroundColor: "背景色",
  cardColor: "カード背景色",
  sidebarColor: "サイドバー色",
  textColor: "テキスト色",
  darkMode: "ダークモード",
  logoUrl: "ロゴ URL",
  faviconUrl: "ファビコン URL",
  customCss: "カスタム CSS",
  
  // Access
  accessDenied: "アクセス拒否",
  noPermission: "システム設定にアクセスする権限がありません。",
  adminOnlyAccess: "スーパー管理者とジムのオーナーのみがこれらの設定を管理できます。",
  goBack: "戻る",
  
  // Membership
  membershipExpired: "メンバーシップが期限切れ",
  renewMembership: "メンバーシップを更新",
  membershipExpiredMessage: "メンバーシップが期限切れです。ダッシュボードへのアクセスを続けるには更新してください。",
  member: "メンバー",
  membershipEndDate: "メンバーシップが期限切れ",
  
  // Currencies
  usd: "USD - 米ドル",
  eur: "EUR - ユーロ",
  inr: "INR - インドルピー",
  gbp: "GBP - 英国ポンド",
  cad: "CAD - カナダドル",
  aud: "AUD - オーストラリアドル",
  jpy: "JPY - 日本円",
  cny: "CNY - 中国元",
};

// Arabic translations
const ar = {
  // Common
  dashboard: "لوحة التحكم",
  settings: "الإعدادات",
  save: "حفظ",
  cancel: "إلغاء",
  loading: "جارٍ التحميل...",
  success: "نجاح",
  error: "خطأ",
  refresh: "تحديث",
  profile: "الملف الشخصي",
  logout: "تسجيل الخروج",
  subscriptionActive: "الاشتراك نشط",
  
  // Navigation
  navigation: "التنقل",
  home: "الرئيسية",
  members: "الأعضاء",
  trainers: "المدربون",
  workouts: "التمارين",
  dietPlans: "خطط النظام الغذائي",
  billing: "الفوترة والخطط",
  reports: "التقارير",
  systemSettings: "إعدادات النظام",
  gymManagement: "إدارة الجيم",
  userManagement: "إدارة المستخدمين",
  
  // Settings
  globalSettings: "الإعدادات العامة",
  branding: "العلامة التجارية والمظهر",
  notifications: "الإشعارات",
  messageTemplates: "قوالب الرسائل",
  integrations: "التكاملات",
  configureSettings: "تكوين الإعدادات العامة والخاصة بالجيم",
  saveAllChanges: "حفظ جميع التغييرات",
  settingsSaved: "تم حفظ الإعدادات بنجاح",
  
  // Settings - Global
  appName: "اسم التطبيق",
  defaultCurrency: "العملة الافتراضية",
  defaultLanguage: "اللغة الافتراضية",
  defaultTimezone: "المنطقة الزمنية الافتراضية",
  dateFormat: "تنسيق التاريخ",
  timeFormat: "تنسيق الوقت",
  
  // Settings - Branding
  primaryColor: "اللون الأساسي (الأزرار، الروابط)",
  secondaryColor: "اللون الثانوي (التأكيد)",
  backgroundColor: "لون الخلفية",
  cardColor: "لون خلفية البطاقة",
  sidebarColor: "لون الشريط الجانبي",
  textColor: "لون النص",
  darkMode: "الوضع الداكن",
  logoUrl: "رابط الشعار",
  faviconUrl: "رابط أيقونة الموقع",
  customCss: "CSS مخصص",
  
  // Access
  accessDenied: "تم رفض الوصول",
  noPermission: "ليس لديك إذن للوصول إلى إعدادات النظام.",
  adminOnlyAccess: "يمكن للمديرين الرئيسيين وأصحاب الجيم فقط إدارة هذه الإعدادات.",
  goBack: "العودة",
  
  // Membership
  membershipExpired: "انتهت صلاحية العضوية",
  renewMembership: "تجديد العضوية",
  membershipExpiredMessage: "انتهت صلاحية عضويتك. يرجى التجديد لمواصلة الوصول إلى لوحة التحكم.",
  member: "عضو",
  membershipEndDate: "انتهت صلاحية عضويتك",
  
  // Currencies
  usd: "USD - دولار أمريكي",
  eur: "EUR - يورو",
  inr: "INR - روبية هندية",
  gbp: "GBP - جنيه إسترليني",
  cad: "CAD - دولار كندي",
  aud: "AUD - دولار أسترالي",
  jpy: "JPY - ين ياباني",
  cny: "CNY - يوان صيني",
};
const de = {
  // Common
  dashboard: "Dashboard",
  settings: "Einstellungen",
  save: "Speichern",
  cancel: "Abbrechen",
  loading: "Lädt...",
  success: "Erfolg",
  error: "Fehler",
  refresh: "Aktualisieren",
  profile: "Profil",
  logout: "Abmelden",
  subscriptionActive: "Abonnement aktiv",
  
  // Navigation
  navigation: "Navigation",
  home: "Startseite",
  members: "Mitglieder",
  trainers: "Trainer",
  workouts: "Workouts",
  dietPlans: "Ernährungspläne",
  billing: "Abrechnung und Pläne",
  reports: "Berichte",
  systemSettings: "Systemeinstellungen",
  gymManagement: "Fitnessstudio-Verwaltung",
  userManagement: "Benutzerverwaltung",
  
  // Settings
  globalSettings: "Globale Einstellungen",
  branding: "Branding und Erscheinungsbild",
  notifications: "Benachrichtigungen",
  messageTemplates: "Nachrichtenvorlagen",
  integrations: "Integrationen",
  configureSettings: "Globale und fitnessstudiospezifische Einstellungen konfigurieren",
  saveAllChanges: "Alle Änderungen speichern",
  settingsSaved: "Einstellungen erfolgreich gespeichert",
  
  // Settings - Global
  appName: "Anwendungsname",
  defaultCurrency: "Standardwährung",
  defaultLanguage: "Standardsprache",
  defaultTimezone: "Standardzeitzone",
  dateFormat: "Datumsformat",
  timeFormat: "Zeitformat",
  
  // Settings - Branding
  primaryColor: "Primärfarbe (Schaltflächen, Links)",
  secondaryColor: "Sekundärfarbe (Akzente)",
  backgroundColor: "Hintergrundfarbe",
  cardColor: "Kartenhintergrundfarbe",
  sidebarColor: "Seitenleistenfarbe",
  textColor: "Textfarbe",
  darkMode: "Dunkler Modus",
  logoUrl: "Logo-URL",
  faviconUrl: "Favicon-URL",
  customCss: "Benutzerdefiniertes CSS",
  
  // Access
  accessDenied: "Zugriff verweigert",
  noPermission: "Sie haben keine Berechtigung, auf die Systemeinstellungen zuzugreifen.",
  adminOnlyAccess: "Nur Super-Admins und Fitnessstudio-Besitzer können diese Einstellungen verwalten.",
  goBack: "Zurück",
  
  // Membership
  membershipExpired: "Mitgliedschaft abgelaufen",
  renewMembership: "Mitgliedschaft verlängern",
  membershipExpiredMessage: "Ihre Mitgliedschaft ist abgelaufen. Bitte verlängern Sie, um weiterhin auf das Dashboard zuzugreifen.",
  member: "Mitglied",
  membershipEndDate: "Ihre Mitgliedschaft ist abgelaufen",
  
  // Currencies
  usd: "USD - US-Dollar",
  eur: "EUR - Euro",
  inr: "INR - Indische Rupie",
  gbp: "GBP - Britisches Pfund",
  cad: "CAD - Kanadischer Dollar",
  aud: "AUD - Australischer Dollar",
  jpy: "JPY - Japanischer Yen",
  cny: "CNY - Chinesischer Yuan",
};
// All available translations
const translations = {
  English: en,
  Spanish: es,
  Hindi: hi,
  French: fr,
  Chinese: zh,
  Japanese: ja,
  Arabic: ar,
  German: de,
};

// Current language (default to English)
let currentLanguage = 'English';

/**
 * Set the current language for translations
 * @param {string} language - Language name (e.g., 'English', 'Spanish')
 */
export const setLanguage = (language) => {
  if (translations[language]) {
    currentLanguage = language;
    // Store the language preference
    localStorage.setItem('gym_language', language);
    // Update HTML lang attribute
    document.documentElement.lang = getLanguageCode(language);
    
    // Dispatch a custom event that components can listen for
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
    
    return true;
  }
  return false;
};

/**
 * Get the current language
 * @returns {string} Current language name
 */
export const getLanguage = () => {
  return currentLanguage;
};

/**
 * Get the language code for HTML lang attribute
 * @param {string} language - Language name
 * @returns {string} Language code (e.g., 'en', 'es')
 */
export const getLanguageCode = (language) => {
  const codes = {
    'English': 'en',
    'Spanish': 'es',
    'Hindi': 'hi',
    'French': 'fr',
    'German': 'de',
    'Chinese': 'zh',
    'Japanese': 'ja',
    'Arabic': 'ar'
  };
  
  return codes[language] || 'en';
};

/**
 * Translate a key to the current language
 * @param {string} key - Translation key
 * @returns {string} Translated text
 */
export const translate = (key) => {
  const lang = translations[currentLanguage] || translations.English;
  return lang[key] || translations.English[key] || key;
};

/**
 * Initialize translations from settings
 */
export const initializeTranslations = () => {
  try {
    // Try to get language from localStorage
    const storedLanguage = localStorage.getItem('gym_language');
    
    if (storedLanguage && translations[storedLanguage]) {
      setLanguage(storedLanguage);
    } else {
      // Try to get language from settings
      const settingsStr = localStorage.getItem('gym_settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings.global?.language && translations[settings.global.language]) {
          setLanguage(settings.global.language);
        }
      }
    }
  } catch (error) {
    console.error('Error initializing translations:', error);
  }
};

// Initialize translations
initializeTranslations();

export default translations;