export const translations = {
  ru: {
    // Common
    loading: 'Загрузка...',
    error: 'Ошибка',
    save: 'Сохранить',
    cancel: 'Отмена',
    create: 'Создать',
    edit: 'Редактировать',
    delete: 'Удалить',
    view: 'Просмотр',
    back: 'Назад',
    search: 'Поиск',
    refresh: 'Обновить',
    yes: 'Да',
    no: 'Нет',
    actions: 'Действия',
    backTo: 'Назад к',
    details: 'Детали',
    items: 'элементов',
    noDataFound: 'Данные не найдены',
    errorLoadingData: 'Ошибка загрузки данных',
    update: 'Обновить',
    saving: 'Сохранение...',

    // Model list page
    records: 'записей',
    record: 'запись',
    recordsGenitive: 'записи',
    createModel: 'Создать {model}',
    searchModel: 'Искать {model}...',
    noData: 'Нет данных',
    modelNotFound: 'Модель не найдена',
    modelNotFoundDesc: 'Модель "{model}" не существует в вашей схеме.',
    errorLoading: 'Ошибка загрузки данных',
    confirmDelete: 'Вы уверены, что хотите удалить эту запись?',

    // Pagination
    showing: 'Показано',
    of: 'из',
    results: 'результатов',
    perPage: 'на странице',
    page: 'Страница',
    pageOf: 'из',

    // Form
    creating: 'Создание',
    editing: 'Редактирование',
    backToList: 'Вернуться к списку',
    required: 'Обязательное поле',

    // View page
    viewRecord: 'Просмотр записи',
    recordNotFound: 'Запись не найдена',
    recordNotFoundDesc: 'Запись с ID "{id}" не найдена.',

    // Sidebar
    models: 'Модели',
    logout: 'Выйти',
    settings: 'Настройки',
    dashboard: 'Дашборд',
    tables: 'Таблицы',
    database: 'База данных',

    // Login
    login: 'Вход',
    email: 'Email',
    password: 'Пароль',
    loginButton: 'Войти',
    invalidCredentials: 'Неверный email или пароль',

    // Settings (already in SettingsModal)
    settingsTitle: 'Настройки',
    appearance: 'Внешний вид',
    theme: 'Тема',
    dark: 'Тёмная',
    light: 'Светлая',
    system: 'Системная',
    language: 'Язык',
    table: 'Таблицы',
    pageSize: 'Записей на странице',
    compactMode: 'Компактный режим',
    data: 'Данные',
    autoRefresh: 'Автообновление',
    refreshInterval: 'Интервал (сек)',
    dateFormat: 'Формат даты',
    relative: 'Относительный',
    reset: 'Сбросить настройки'
  },
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    back: 'Back',
    search: 'Search',
    refresh: 'Refresh',
    yes: 'Yes',
    no: 'No',
    actions: 'Actions',
    backTo: 'Back to',
    details: 'Details',
    items: 'items',
    noDataFound: 'No data found',
    errorLoadingData: 'Error loading data',
    update: 'Update',
    saving: 'Saving...',

    // Model list page
    records: 'records',
    record: 'record',
    recordsGenitive: 'records',
    createModel: 'Create {model}',
    searchModel: 'Search {model}...',
    noData: 'No data',
    modelNotFound: 'Model not found',
    modelNotFoundDesc: 'The model "{model}" does not exist in your schema.',
    errorLoading: 'Error loading data',
    confirmDelete: 'Are you sure you want to delete this record?',

    // Pagination
    showing: 'Showing',
    of: 'of',
    results: 'results',
    perPage: 'per page',
    page: 'Page',
    pageOf: 'of',

    // Form
    creating: 'Create',
    editing: 'Edit',
    backToList: 'Back to list',
    required: 'Required field',

    // View page
    viewRecord: 'View record',
    recordNotFound: 'Record not found',
    recordNotFoundDesc: 'Record with ID "{id}" was not found.',

    // Sidebar
    models: 'Models',
    logout: 'Logout',
    settings: 'Settings',
    dashboard: 'Dashboard',
    tables: 'Tables',
    database: 'Database',

    // Login
    login: 'Login',
    email: 'Email',
    password: 'Password',
    loginButton: 'Login',
    invalidCredentials: 'Invalid email or password',

    // Settings
    settingsTitle: 'Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    system: 'System',
    language: 'Language',
    table: 'Tables',
    pageSize: 'Records per page',
    compactMode: 'Compact mode',
    data: 'Data',
    autoRefresh: 'Auto refresh',
    refreshInterval: 'Interval (sec)',
    dateFormat: 'Date format',
    relative: 'Relative',
    reset: 'Reset settings'
  }
} as const

export type TranslationKey = keyof typeof translations.ru
export type Language = keyof typeof translations
