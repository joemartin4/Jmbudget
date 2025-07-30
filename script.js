// Datos de la aplicación
let categories = [];
let transactions = [];
let categoryGroups = {};
let currentUser = null;
let users = JSON.parse(localStorage.getItem('budgetUsers')) || {};
let collaborations = {};
let invitations = {};
let changeHistory = {};
let importData = {
    file: null,
    parsedData: [],
    validRows: [],
    invalidRows: []
};

// Variables globales para ingresos recurrentes
let incomes = [];

// Función para cargar datos de forma segura
function loadDataSafely() {
    try {
        const categoriesData = localStorage.getItem('budgetCategories');
        const transactionsData = localStorage.getItem('budgetTransactions');
        const categoryGroupsData = localStorage.getItem('budgetCategoryGroups');
        
        categories = categoriesData ? JSON.parse(categoriesData) : [];
        transactions = transactionsData ? JSON.parse(transactionsData) : [];
        categoryGroups = categoryGroupsData ? JSON.parse(categoryGroupsData) : {};
        
        // Validar que los datos sean arrays/objetos válidos
        if (!Array.isArray(categories)) categories = [];
        if (!Array.isArray(transactions)) transactions = [];
        if (typeof categoryGroups !== 'object' || categoryGroups === null) categoryGroups = {};
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        categories = [];
        transactions = [];
        categoryGroups = {};
    }
}

// Cargar datos al inicio
loadDataSafely();

// Sistema de Login
function initializeLogin() {
    // Cargar usuarios existentes
    users = JSON.parse(localStorage.getItem('budgetUsers')) || {};
    
    // Verificar si hay un usuario logueado
    const loggedInUser = localStorage.getItem('budgetCurrentUser');
    if (loggedInUser && users[loggedInUser]) {
        loginUser(loggedInUser);
        return;
    }
    
    // Mostrar pantalla de login
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('currentUser').textContent = currentUser;
}

function loginUser(username) {
    currentUser = username;
    localStorage.setItem('budgetCurrentUser', username);
    
    // Cargar datos del usuario
    loadUserData();
    
    // Mostrar aplicación principal
    showMainApp();
    
    // Inicializar aplicación
    initializeApp();
}

function logoutUser() {
    currentUser = null;
    categories = [];
    transactions = [];
    categoryGroups = {};
    incomes = [];
    localStorage.removeItem('budgetCurrentUser');
    // Limpiar UI
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    // Limpiar campos de login
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function loadUserData() {
    const userData = users[currentUser] || {
        categories: [],
        transactions: [],
        categoryGroups: {},
        incomes: [],
        notifications: []
    };
    
    categories = userData.categories || [];
    transactions = userData.transactions || [];
    categoryGroups = userData.categoryGroups || {};
    incomes = userData.incomes || [];
    notifications = userData.notifications || [];
    
    console.log('📥 Datos cargados para usuario:', currentUser);
    console.log('📊 Resumen de datos cargados:');
    console.log('  - Categorías:', categories.length);
    console.log('  - Transacciones:', transactions.length);
    console.log('  - Ingresos:', incomes.length);
    console.log('  - Notificaciones:', notifications.length);
}

function saveUserData() {
    if (!currentUser) return;
    
    const userData = {
        categories: categories,
        transactions: transactions,
        categoryGroups: categoryGroups,
        incomes: incomes,
        notifications: notifications
    };
    
    users[currentUser] = userData;
    
    try {
        localStorage.setItem('budgetUsers', JSON.stringify(users));
        console.log('✅ Datos guardados exitosamente para usuario:', currentUser);
        console.log('📊 Resumen de datos guardados:');
        console.log('  - Categorías:', categories.length);
        console.log('  - Transacciones:', transactions.length);
        console.log('  - Ingresos:', incomes.length);
        console.log('  - Notificaciones:', notifications.length);
    } catch (error) {
        console.error('❌ Error al guardar datos:', error);
        alert('Error al guardar los datos. Verifica el espacio disponible en tu navegador.');
    }
}

function registerUser(username, password) {
    console.log('Intentando registrar usuario:', username);
    console.log('Usuarios existentes:', Object.keys(users));
    
    if (users[username]) {
        alert('El usuario ya existe. Por favor, elige otro nombre de usuario.');
        return false;
    }
    
    users[username] = {
        categories: [],
        transactions: [],
        categoryGroups: {},
        incomes: [],
        notifications: []
    };
    
    localStorage.setItem('budgetUsers', JSON.stringify(users));
    console.log('Usuario registrado exitosamente:', username);
    return true;
}

function validateLogin(username, password) {
    console.log('Validando login para usuario:', username);
    console.log('Usuarios disponibles:', Object.keys(users));
    
    if (!users[username]) {
        alert('Usuario no encontrado. Por favor, regístrate primero.');
        return false;
    }
    
    // En una aplicación real, aquí se validaría la contraseña
    // Por simplicidad, solo verificamos que el usuario existe
    console.log('Login válido para usuario:', username);
    return true;
}

// Sistema de Colaboración
function initializeCollaboration() {
    collaborations = JSON.parse(localStorage.getItem('budgetCollaborations')) || {};
    invitations = JSON.parse(localStorage.getItem('budgetInvitations')) || {};
}

function openCollaborationModal() {
    openModal('collaborationModal');
    loadCollaborationData();
}

function loadCollaborationData() {
    loadMembersList();
    loadRequestsList();
    updateHistoryFilters();
}

function loadMembersList() {
    const membersList = document.getElementById('membersList');
    const userCollaborations = collaborations[currentUser] || [];
    
    if (userCollaborations.length === 0) {
        membersList.innerHTML = '<p class="no-members">No hay miembros colaborando aún.</p>';
        return;
    }
    
    let html = '';
    userCollaborations.forEach(member => {
        html += `
            <div class="member-item">
                <div class="member-info">
                    <div class="member-name">${member.username}</div>
                    <div class="member-role">${member.role === 'collaborator' ? 'Colaborador' : 'Solo lectura'}</div>
                </div>
                <div class="member-actions">
                    <button class="btn-remove" onclick="removeCollaborator('${member.username}')">
                        <i class="fas fa-user-times"></i> Remover
                    </button>
                </div>
            </div>
        `;
    });
    
    membersList.innerHTML = html;
}

function loadRequestsList() {
    const requestsList = document.getElementById('requestsList');
    const userInvitations = invitations[currentUser] || [];
    
    if (userInvitations.length === 0) {
        requestsList.innerHTML = '<p class="no-requests">No hay solicitudes pendientes.</p>';
        return;
    }
    
    let html = '';
    userInvitations.forEach(invitation => {
        html += `
            <div class="request-item">
                <div class="request-info">
                    <div class="request-name">${invitation.fromUser}</div>
                    <div class="request-email">${invitation.email}</div>
                    <div class="request-role">${invitation.role === 'collaborator' ? 'Colaborador' : 'Solo lectura'}</div>
                </div>
                <div class="request-actions">
                    <button class="btn-accept" onclick="acceptInvitation('${invitation.id}')">
                        <i class="fas fa-check"></i> Aceptar
                    </button>
                    <button class="btn-decline" onclick="declineInvitation('${invitation.id}')">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                </div>
            </div>
        `;
    });
    
    requestsList.innerHTML = html;
}

function sendInvitation() {
    const email = document.getElementById('inviteEmail').value.trim();
    const role = document.getElementById('inviteRole').value;
    const message = document.getElementById('inviteMessage').value.trim();
    
    if (!email) {
        alert('Por favor, ingresa un email válido.');
        return;
    }
    
    // Simular envío de invitación
    const invitationId = Date.now().toString();
    const invitation = {
        id: invitationId,
        fromUser: currentUser,
        email: email,
        role: role,
        message: message,
        date: new Date().toISOString(),
        status: 'pending'
    };
    
    // Guardar invitación
    if (!invitations[email]) {
        invitations[email] = [];
    }
    invitations[email].push(invitation);
    localStorage.setItem('budgetInvitations', JSON.stringify(invitations));
    
    // Limpiar formulario
    document.getElementById('inviteEmail').value = '';
    document.getElementById('inviteMessage').value = '';
    
    alert('Invitación enviada exitosamente. El usuario recibirá una notificación cuando se registre.');
    closeModal('collaborationModal');
}

function acceptInvitation(invitationId) {
    const userInvitations = invitations[currentUser] || [];
    const invitation = userInvitations.find(inv => inv.id === invitationId);
    
    if (!invitation) return;
    
    // Agregar colaboración
    if (!collaborations[invitation.fromUser]) {
        collaborations[invitation.fromUser] = [];
    }
    
    collaborations[invitation.fromUser].push({
        username: currentUser,
        role: invitation.role,
        date: new Date().toISOString()
    });
    
    // Remover invitación
    invitations[currentUser] = userInvitations.filter(inv => inv.id !== invitationId);
    
    // Guardar cambios
    localStorage.setItem('budgetCollaborations', JSON.stringify(collaborations));
    localStorage.setItem('budgetInvitations', JSON.stringify(invitations));
    
    alert('Has aceptado la invitación. Ahora puedes colaborar en el presupuesto.');
    loadCollaborationData();
}

function declineInvitation(invitationId) {
    const userInvitations = invitations[currentUser] || [];
    invitations[currentUser] = userInvitations.filter(inv => inv.id !== invitationId);
    
    localStorage.setItem('budgetInvitations', JSON.stringify(invitations));
    
    alert('Has rechazado la invitación.');
    loadCollaborationData();
}

function removeCollaborator(username) {
    if (!confirm(`¿Estás seguro de que quieres remover a ${username} del presupuesto?`)) {
        return;
    }
    
    const userCollaborations = collaborations[currentUser] || [];
    collaborations[currentUser] = userCollaborations.filter(member => member.username !== username);
    
    localStorage.setItem('budgetCollaborations', JSON.stringify(collaborations));
    
    alert(`${username} ha sido removido del presupuesto.`);
    loadCollaborationData();
}

function setupCollaborationTabs() {
    const tabButtons = document.querySelectorAll('.collab-tab-btn');
    const tabContents = document.querySelectorAll('.collab-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Agregar clase active al botón y contenido seleccionado
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Cargar datos específicos de la pestaña
            if (tabName === 'history') {
                loadHistoryData();
            }
        });
    });
}

// Sistema de Historial y Comentarios
function initializeHistory() {
    changeHistory = JSON.parse(localStorage.getItem('budgetChangeHistory')) || {};
}

function addToHistory(action, details, type = 'general') {
    if (!currentUser) return;
    
    const historyEntry = {
        id: Date.now().toString(),
        user: currentUser,
        action: action,
        details: details,
        type: type,
        timestamp: new Date().toISOString()
    };
    
    if (!changeHistory[currentUser]) {
        changeHistory[currentUser] = [];
    }
    
    changeHistory[currentUser].unshift(historyEntry);
    
    // Mantener solo los últimos 100 cambios
    if (changeHistory[currentUser].length > 100) {
        changeHistory[currentUser] = changeHistory[currentUser].slice(0, 100);
    }
    
    localStorage.setItem('budgetChangeHistory', JSON.stringify(changeHistory));
}

function loadHistoryData() {
    const historyList = document.getElementById('historyList');
    const typeFilter = document.getElementById('historyTypeFilter').value;
    const userFilter = document.getElementById('historyUserFilter').value;
    
    let allHistory = [];
    
    // Obtener historial de todos los usuarios colaborando
    const userCollaborations = collaborations[currentUser] || [];
    const allUsers = [currentUser, ...userCollaborations.map(member => member.username)];
    
    allUsers.forEach(user => {
        const userHistory = changeHistory[user] || [];
        allHistory = allHistory.concat(userHistory.map(entry => ({ ...entry, originalUser: user })));
    });
    
    // Filtrar por tipo
    if (typeFilter) {
        allHistory = allHistory.filter(entry => entry.type === typeFilter);
    }
    
    // Filtrar por usuario
    if (userFilter) {
        allHistory = allHistory.filter(entry => entry.originalUser === userFilter);
    }
    
    // Ordenar por timestamp (más reciente primero)
    allHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (allHistory.length === 0) {
        historyList.innerHTML = '<p class="no-history">No hay cambios registrados aún.</p>';
        return;
    }
    
    let html = '';
    allHistory.forEach(entry => {
        const timeAgo = getTimeAgo(new Date(entry.timestamp));
        const isOwnEntry = entry.originalUser === currentUser;
        
        html += `
            <div class="history-item ${entry.type}">
                <div class="history-info">
                    <div class="history-action">${entry.action}</div>
                    <div class="history-details">${entry.details}</div>
                    <div class="history-user">${isOwnEntry ? 'Tú' : entry.originalUser}</div>
                </div>
                <div class="history-time">${timeAgo}</div>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
}

function updateHistoryFilters() {
    const userFilter = document.getElementById('historyUserFilter');
    const userCollaborations = collaborations[currentUser] || [];
    
    let html = '<option value="">Todos los usuarios</option>';
    html += `<option value="${currentUser}">Tú</option>`;
    
    userCollaborations.forEach(member => {
        html += `<option value="${member.username}">${member.username}</option>`;
    });
    
    userFilter.innerHTML = html;
}

// Sistema de Importación
function initializeImport() {
    setupImportTabs();
    setupFileUpload();
}

function setupImportTabs() {
    const tabButtons = document.querySelectorAll('.import-tab-btn');
    const tabContents = document.querySelectorAll('.import-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Agregar clase active al botón y contenido seleccionado
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

function setupFileUpload() {
    const dropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const processFileBtn = document.getElementById('processFileBtn');
    
    // Click en drop zone
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // Process file button
    processFileBtn.addEventListener('click', processFile);
}

function handleFileSelect(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    
    // Validar tipo de archivo
    const validTypes = ['.csv', '.xlsx', '.xls', '.json'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
        alert('Por favor selecciona un archivo CSV, XLSX, XLS o JSON válido.');
        return;
    }
    
    // Si es un archivo JSON, procesarlo como backup
    if (fileExtension === '.json') {
        importUserData(file);
        return;
    }
    
    // Mostrar información del archivo
    fileName.textContent = file.name;
    fileSize.textContent = `(${formatFileSize(file.size)})`;
    fileInfo.style.display = 'flex';
    
    // Guardar archivo
    importData.file = file;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function processFile() {
    if (!importData.file) {
        alert('Por favor selecciona un archivo primero.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            parseFileContent(content);
        } catch (error) {
            alert('Error al procesar el archivo: ' + error.message);
        }
    };
    
    reader.readAsText(importData.file);
}

function parseFileContent(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validar headers requeridos
    const requiredHeaders = ['descripción', 'monto', 'tipo', 'categoría', 'fecha'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
        alert(`Faltan las siguientes columnas: ${missingHeaders.join(', ')}`);
        return;
    }
    
    // Procesar filas
    importData.parsedData = [];
    importData.validRows = [];
    importData.invalidRows = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        const validation = validateRow(row, i);
        if (validation.isValid) {
            importData.validRows.push(row);
        } else {
            row.errors = validation.errors;
            importData.invalidRows.push(row);
        }
        
        importData.parsedData.push(row);
    }
    
    showPreview();
}

function validateRow(row, rowNumber) {
    const errors = [];
    
    // Validar descripción
    if (!row.descripción || row.descripción.trim() === '') {
        errors.push('Descripción requerida');
    }
    
    // Validar monto
    const amount = parseFloat(row.monto);
    if (isNaN(amount)) {
        errors.push('Monto debe ser un número válido');
    }
    
    // Validar tipo
    if (!row.tipo || !['ingreso', 'gasto'].includes(row.tipo.toLowerCase())) {
        errors.push('Tipo debe ser "ingreso" o "gasto"');
    }
    
    // Validar categoría
    if (!row.categoría || row.categoría.trim() === '') {
        errors.push('Categoría requerida');
    }
    
    // Validar fecha
    const date = new Date(row.fecha);
    if (isNaN(date.getTime())) {
        errors.push('Fecha debe estar en formato YYYY-MM-DD');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function showPreview() {
    const totalRows = document.getElementById('totalRows');
    const validRows = document.getElementById('validRows');
    const invalidRows = document.getElementById('invalidRows');
    const importDataBtn = document.getElementById('importDataBtn');
    const previewContent = document.getElementById('previewContent');
    
    // Actualizar estadísticas
    totalRows.textContent = `Total: ${importData.parsedData.length} filas`;
    validRows.textContent = `Válidas: ${importData.validRows.length}`;
    invalidRows.textContent = `Con errores: ${importData.invalidRows.length}`;
    
    // Habilitar botón de importación si hay filas válidas
    importDataBtn.disabled = importData.validRows.length === 0;
    
    // Mostrar vista previa
    if (importData.parsedData.length === 0) {
        previewContent.innerHTML = '<p class="no-preview">No se encontraron datos en el archivo</p>';
        return;
    }
    
    let html = '<table><thead><tr>';
    const headers = Object.keys(importData.parsedData[0]);
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    importData.parsedData.forEach((row, index) => {
        const isValid = importData.validRows.includes(row);
        const rowClass = isValid ? 'valid-row' : 'invalid-row';
        
        html += `<tr class="${rowClass}">`;
        headers.forEach(header => {
            const value = row[header] || '';
            const isError = !isValid && row.errors && row.errors.includes(header);
            const cellClass = isError ? 'error-cell' : '';
            html += `<td class="${cellClass}">${value}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    previewContent.innerHTML = html;
    
    // Cambiar a pestaña de vista previa
    document.querySelector('[data-tab="preview"]').click();
}

function importValidData() {
    if (importData.validRows.length === 0) {
        alert('No hay datos válidos para importar.');
        return;
    }
    
    let importedCount = 0;
    let categoriesCreated = 0;
    
    importData.validRows.forEach(row => {
        // Crear transacción
        const transaction = {
            id: Date.now() + Math.random(),
            description: row.descripción,
            amount: Math.abs(parseFloat(row.monto)),
            type: row.tipo.toLowerCase(),
            category: row.categoría,
            date: row.fecha,
            comment: row.comentario || null,
            createdBy: currentUser,
            createdAt: new Date().toISOString(),
            lastModifiedBy: currentUser,
            lastModifiedAt: new Date().toISOString()
        };
        
        transactions.push(transaction);
        
        // Crear categoría si no existe
        if (!categoryGroups[row.categoría]) {
            categoryGroups[row.categoría] = [];
            categoriesCreated++;
        }
        
        // Crear subcategoría si existe y no está en la categoría
        if (row.subcategoría && !categoryGroups[row.categoría].includes(row.subcategoría)) {
            categoryGroups[row.categoría].push(row.subcategoría);
        }
        
        // Actualizar spent si es gasto
        if (transaction.type === 'gasto') {
            const category = categories.find(c => c.name === transaction.category);
            if (category) {
                category.spent += transaction.amount;
            }
        }
        
        importedCount++;
    });
    
    // Registrar en historial
    addToHistory(
        'Importó datos',
        `${importedCount} transacciones importadas, ${categoriesCreated} categorías creadas`,
        'transaction'
    );
    
    // Guardar datos
    saveData();
    saveCategoryGroups();
    updateUI();
    
    // Mostrar resumen
    alert(`Importación completada:\n- ${importedCount} transacciones importadas\n- ${categoriesCreated} categorías creadas`);
    
    // Limpiar datos de importación
    importData = {
        file: null,
        parsedData: [],
        validRows: [],
        invalidRows: []
    };
    
    // Cerrar modal
    closeModal('importModal');
    
    // Limpiar vista previa
    document.getElementById('previewContent').innerHTML = '<p class="no-preview">Sube un archivo para ver la vista previa</p>';
    document.getElementById('fileInfo').style.display = 'none';
}

function resetToDefaultCategories() {
    if (!confirm('¿Estás seguro de que quieres restablecer todas las categorías por defecto? Esto eliminará las categorías personalizadas que hayas creado.')) {
        return;
    }
    
    // Restablecer categoryGroups a las categorías por defecto
    categoryGroups = { ...defaultCategoryGroups };
    saveCategoryGroups();
    
    // Limpiar categorías del presupuesto (mantener solo las básicas)
    categories = [
        {
            id: Date.now() + 1,
            name: 'Alimentación y Bebidas',
            subcategory: 'Supermercado',
            budget: 12000,
            recurringDate: new Date().toISOString().split('T')[0],
            color: defaultColors['Alimentación y Bebidas'],
            spent: 0
        },
        {
            id: Date.now() + 2,
            name: 'Vivienda y Servicios',
            subcategory: 'Renta o hipoteca',
            budget: 18000,
            recurringDate: new Date().toISOString().split('T')[0],
            color: defaultColors['Vivienda y Servicios'],
            spent: 0
        },
        {
            id: Date.now() + 3,
            name: 'Transporte',
            subcategory: 'Gasolina',
            budget: 4000,
            recurringDate: new Date().toISOString().split('T')[0],
            color: defaultColors['Transporte'],
            spent: 0
        }
    ];
    
    saveData();
    clearCaches();
    updateUI(true);
    
    // Registrar en historial
    addToHistory(
        'Restableció categorías por defecto',
        'Categorías personalizadas eliminadas, restauradas categorías por defecto',
        'category'
    );
    
    alert('Categorías restablecidas por defecto. Se han eliminado las categorías personalizadas.');
}



// Colores por defecto para las categorías principales
const defaultColors = {
    'Alimentación y Bebidas': '#34c759',      // Verde
    'Vivienda y Servicios': '#ff9500',        // Naranja
    'Transporte': '#007aff',                  // Azul
    'Salud y Bienestar': '#ff3b30',          // Rojo
    'Educación': '#5856d6',                  // Índigo
    'Ropa y Calzado': '#ff2d92',            // Rosa
    'Entretenimiento y Ocio': '#af52de',     // Púrpura
    'Tecnología y Comunicación': '#5ac8fa',  // Cian
    'Servicios Financieros': '#30d158',      // Verde claro
    'Mascotas': '#8e8e93',                  // Gris
    'Regalos y Celebraciones': '#ffcc02',    // Amarillo
    'Gastos Varios': '#8e8e93'              // Gris
};

// Categorías por defecto si no existen datos
const defaultCategoryGroups = {
    'Alimentación y Bebidas': [
        'Supermercado semanal',
        'Frutas y verduras',
        'Carnes y pescados',
        'Lácteos y huevos',
        'Pan y cereales',
        'Bebidas y jugos',
        'Snacks y dulces',
        'Restaurantes',
        'Delivery y comida rápida',
        'Café y bebidas fuera',
        'Especias y condimentos',
        'Productos de limpieza'
    ],
    'Transporte': [
        'Gasolina',
        'Transporte público',
        'Uber/Taxi',
        'Mantenimiento del auto',
        'Seguro del auto',
        'Estacionamiento',
        'Peajes',
        'Bicicleta',
        'Reparaciones',
        'Licencias y permisos'
    ],
    'Vivienda': [
        'Renta',
        'Hipoteca',
        'Servicios básicos',
        'Mantenimiento',
        'Seguro de hogar',
        'Muebles y decoración',
        'Jardinería',
        'Limpieza',
        'Reparaciones menores',
        'Mejoras del hogar'
    ],
    'Salud': [
        'Consultas médicas',
        'Medicamentos',
        'Seguro médico',
        'Dentista',
        'Óptica',
        'Gimnasio',
        'Vitaminas',
        'Emergencias médicas',
        'Terapias',
        'Exámenes médicos'
    ],
    'Educación': [
        'Colegiatura',
        'Libros y materiales',
        'Cursos y talleres',
        'Transporte escolar',
        'Uniformes',
        'Actividades extracurriculares',
        'Tecnología educativa',
        'Tutorías',
        'Eventos escolares',
        'Becas y ayudas'
    ],
    'Entretenimiento': [
        'Cine y teatro',
        'Conciertos',
        'Deportes',
        'Videojuegos',
        'Libros y revistas',
        'Música y streaming',
        'Hobbies',
        'Viajes y vacaciones',
        'Restaurantes',
        'Actividades sociales'
    ],
    'Tecnología y Comunicación': [
        'Celulares y tablets',
        'Computadoras',
        'Accesorios tecnológicos',
        'Software y apps',
        'Servicios en la nube',
        'Reparaciones',
        'Cables y cargadores',
        'Impresión y fotos',
        'Gadgets y wearables',
        'Consolas de videojuegos',
        'Audio y video',
        'Equipos de oficina'
    ],
    'Servicios Financieros': [
        'Cuenta de ahorros',
        'Inversiones',
        'Fondo de emergencia',
        'Seguros varios',
        'Pensiones',
        'Tarjetas de crédito',
        'Préstamos',
        'Gastos bancarios',
        'Impuestos',
        'Metas financieras',
        'Criptomonedas',
        'Planes de retiro'
    ],
    'Mascotas': [
        'Alimento para mascotas',
        'Veterinario',
        'Vacunas',
        'Juguetes y accesorios',
        'Pelaje y limpieza',
        'Seguro de mascotas',
        'Adiestramiento',
        'Pensión y cuidado',
        'Medicamentos',
        'Camas y casas',
        'Collares y correas',
        'Servicios de grooming'
    ],
    'Regalos y Celebraciones': [
        'Cumpleaños',
        'Navidad',
        'Día de la madre/padre',
        'Bodas y aniversarios',
        'Graduaciones',
        'Baby showers',
        'Regalos de empresa',
        'Donaciones',
        'Flores y plantas',
        'Tarjetas y envoltorios',
        'Celebraciones especiales',
        'Regalos de último minuto'
    ],
    'Gastos Varios': [
        'Regalos inesperados',
        'Multas y sanciones',
        'Gastos bancarios',
        'Imprevistos',
        'Propinas',
        'Pequeñas reparaciones',
        'Artículos de papelería',
        'Gastos de oficina',
        'Servicios de mensajería',
        'Almacenamiento',
        'Gastos de mudanza',
        'Otros gastos menores'
    ]
};

// Categorías específicas para ingresos
const defaultIncomeCategories = {
    'Ingresos Laborales': [
        'Salario fijo',
        'Comisiones',
        'Bonos',
        'Horas extra',
        'Propinas',
        'Freelance',
        'Consultoría',
        'Trabajo temporal'
    ],
    'Ingresos por Inversiones': [
        'Intereses bancarios',
        'Dividendos',
        'Ganancias de capital',
        'Rendimientos de fondos',
        'Criptomonedas',
        'Bienes raíces',
        'Préstamos personales',
        'Inversiones en negocios'
    ],
    'Ingresos Pasivos': [
        'Alquiler de propiedades',
        'Royalties',
        'Licencias',
        'Afiliados',
        'Publicidad',
        'Venta de productos digitales',
        'Membresías',
        'Suscripciones'
    ],
    'Ingresos Extraordinarios': [
        'Herencia',
        'Premios y lotería',
        'Reembolsos',
        'Compensaciones',
        'Venta de bienes',
        'Donaciones recibidas',
        'Seguros',
        'Indemnizaciones'
    ],
    'Otros Ingresos': [
        'Ventas ocasionales',
        'Trabajos de temporada',
        'Ingresos por hobbies',
        'Ayudas gubernamentales',
        'Becas',
        'Subvenciones',
        'Ingresos por eventos',
        'Otros ingresos varios'
    ]
};

// Elementos del DOM
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const categoryModal = document.getElementById('categoryModal');
const transactionModal = document.getElementById('transactionModal');
const categoryForm = document.getElementById('categoryForm');
const transactionForm = document.getElementById('transactionForm');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando aplicación...');
    
    try {
        loadDataSafely();
        initializeLogin();
        
        // En modo desarrollo, forzar actualización del Service Worker
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.update();
                    });
                });
            }
            
            // Atajo de teclado para limpiar cache (Ctrl+Shift+R o Cmd+Shift+R)
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                    e.preventDefault();
                    console.log('Limpiando cache con atajo de teclado...');
                    if (window.clearAppCache) {
                        window.clearAppCache();
                    } else {
                        window.location.reload();
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error durante la inicialización:', error);
    }
    
    // Event listeners para login
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    console.log('Login button:', loginBtn);
    console.log('Register button:', registerBtn);
    console.log('Logout button:', logoutBtn);
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        console.log('Event listener agregado a loginBtn');
    } else {
        console.error('No se encontró el botón de login');
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
        console.log('Event listener agregado a registerBtn');
    } else {
        console.error('No se encontró el botón de registro');
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
        console.log('Event listener agregado a logoutBtn');
    } else {
        console.error('No se encontró el botón de logout');
    }
    
    // Event listeners para formularios de login
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                passwordInput.focus();
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }

    const subtabBtns = document.querySelectorAll('.subtab-btn');
    const gastosContainer = document.getElementById('gastosContainer');
    const ingresosContainer = document.getElementById('ingresosContainer');
    const addGastoBtn = document.getElementById('addGastoBtn');
    const addIngresoBtn = document.getElementById('addIngresoBtn');

    subtabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            subtabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.subtab === 'gastos') {
                gastosContainer.classList.add('active');
                ingresosContainer.classList.remove('active');
                addGastoBtn.style.display = '';
                addIngresoBtn.style.display = 'none';
            } else {
                gastosContainer.classList.remove('active');
                ingresosContainer.classList.add('active');
                addGastoBtn.style.display = 'none';
                addIngresoBtn.style.display = '';
            }
        });
    });

    // Mostrar por defecto el botón de gasto
    addGastoBtn.style.display = '';
    addIngresoBtn.style.display = 'none';

    // Lógica para crear nueva transacción según tipo
    addGastoBtn.addEventListener('click', function() {
        openTransactionModal('gasto');
    });
    addIngresoBtn.addEventListener('click', function() {
        openTransactionModal('ingreso');
    });
});

function handleLogin() {
    console.log('Función handleLogin ejecutada');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    console.log('Username:', username);
    console.log('Password:', password);
    
    if (!username || !password) {
        alert('Por favor, completa todos los campos.');
        return;
    }
    
    if (validateLogin(username, password)) {
        loginUser(username);
        // Limpiar formulario
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

function handleRegister() {
    console.log('Función handleRegister ejecutada');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    console.log('Username:', username);
    console.log('Password:', password);
    
    if (!username || !password) {
        alert('Por favor, completa todos los campos.');
        return;
    }
    
    if (registerUser(username, password)) {
        alert('Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
        loginUser(username);
        // Limpiar formulario
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

function initializeApp() {
    // Solo inicializar si hay un usuario logueado
    if (!currentUser) return;
    
    console.log('Inicializando aplicación para usuario:', currentUser);
    
    // Verificar elementos críticos del DOM
    const criticalElements = [
        'addCategoryBtn',
        'categoryForm',
        'transactionForm',
        'addGastoBtn',
        'addIngresoBtn',
        'gastosContainer',
        'ingresosContainer'
    ];
    
    const missingElements = criticalElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
        console.warn('⚠️ Elementos faltantes del DOM:', missingElements);
    } else {
        console.log('✅ Todos los elementos críticos del DOM están presentes');
    }
    
    // Inicializar sistemas
    initializeCollaboration();
    initializeHistory();
    initializeImport();
    
    // Inicializar notificaciones después de cargar datos
    setTimeout(() => {
        initializeNotifications();
    }, 100);
    
    // Inicializar tema y PWA
    initializeTheme();
    checkPWAInstallation();
    
    // Configurar guardado automático
    setupAutoSave();
    
    // Inicializar categorías por defecto si no existen
    initializeDefaultCategories();
    
    // Asegurar que las categorías de ingresos estén disponibles
    if (Object.keys(categoryGroups).length === 0) {
        console.log('Inicializando categorías de ingresos...');
        Object.keys(defaultIncomeCategories).forEach(categoryName => {
            categoryGroups[categoryName] = [...defaultIncomeCategories[categoryName]];
        });
        saveCategoryGroups();
    }
    
    // Establecer fecha actual en el formulario de transacciones
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    
    // Establecer fecha actual en el formulario de categorías
    document.getElementById('categoryRecurringDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('selectCategoryRecurringDate').value = new Date().toISOString().split('T')[0];
    
    // Configurar event listeners
    setupEventListeners();
    
    // Actualizar dropdowns de categorías
    updateCategoryDropdowns();
    updateCategorySelect();
    updateCategoryFilters();
    
    // Actualizar la interfaz con force update para asegurar que todo se cargue correctamente
    updateUI(true);
}

function setupEventListeners() {
    console.log('🔧 Configurando event listeners...');
    console.log('🔍 Verificando elementos del DOM...');
    
    // Declarar todas las variables al inicio
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryForm = document.getElementById('categoryForm');
    const transactionForm = document.getElementById('transactionForm');
    const addGastoBtn = document.getElementById('addGastoBtn');
    const addIngresoBtn = document.getElementById('addIngresoBtn');
    
    // Navegación de pestañas
    if (tabButtons && tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                switchTab(button.dataset.tab);
            });
        });
    } else {
        console.error('No se encontraron los botones de pestañas');
    }

    // Botones de modales
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => openModal('categoryModal'));
    } else {
        console.error('No se encontró el elemento addCategoryBtn');
    }
    
    // El botón addTransactionBtn no existe en el HTML, se usan addGastoBtn y addIngresoBtn en su lugar
    
    // Botones de nuevo gasto e ingreso
    if (addGastoBtn) {
        addGastoBtn.addEventListener('click', () => openTransactionModal('gasto'));
    } else {
        console.error('No se encontró el elemento addGastoBtn');
    }
    
    if (addIngresoBtn) {
        addIngresoBtn.addEventListener('click', () => openTransactionModal('ingreso'));
    } else {
        console.error('No se encontró el elemento addIngresoBtn');
    }
    
    const selectCategoryBtn = document.getElementById('selectCategoryBtn');
    if (selectCategoryBtn) {
        selectCategoryBtn.addEventListener('click', () => openModal('selectCategoryModal'));
    } else {
        console.error('No se encontró el elemento selectCategoryBtn');
    }

    // Botón de colaboración
    const collaborationBtn = document.getElementById('collaborationBtn');
    if (collaborationBtn) {
        collaborationBtn.addEventListener('click', openCollaborationModal);
    }
    
    // Botón de importación
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            openModal('importModal');
        });
    }

    // Cerrar modales
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Formularios
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    } else {
        console.error('No se encontró el formulario categoryForm');
    }
    
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    } else {
        console.error('No se encontró el formulario transactionForm');
    }

    // Botones de agregar categoría y subcategoría
    const addSubcategoryBtn = document.getElementById('addSubcategoryBtn');
    const selectCategoryForm = document.getElementById('selectCategoryForm');
    
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', showAddCategoryInput);
    } else {
        console.error('No se encontró el elemento addCategoryBtn');
    }
    
    if (addSubcategoryBtn) {
        addSubcategoryBtn.addEventListener('click', showAddSubcategoryInput);
    } else {
        console.error('No se encontró el elemento addSubcategoryBtn');
    }
    
    if (selectCategoryForm) {
        selectCategoryForm.addEventListener('submit', addSelectedCategoryToBudget);
    } else {
        console.error('No se encontró el formulario selectCategoryForm');
    }
    
    // Event listeners para manejo de frecuencias
    const categoryFrequencySelect = document.getElementById('categoryRecurringFrequency');
    const selectCategoryFrequencySelect = document.getElementById('selectCategoryRecurringFrequency');
    
    if (categoryFrequencySelect) {
        categoryFrequencySelect.addEventListener('change', handleFrequencyChange);
    }
    
    if (selectCategoryFrequencySelect) {
        selectCategoryFrequencySelect.addEventListener('change', handleSelectFrequencyChange);
    }
    
    // Event listeners para cambios de categoría
    const categoryNameSelect = document.getElementById('categoryName');
    const selectCategoryNameSelect = document.getElementById('selectCategoryName');
    
    if (categoryNameSelect) {
        categoryNameSelect.addEventListener('change', updateSubcategoryDropdown);
        console.log('Event listener agregado a categoryName');
    } else {
        console.error('No se encontró el elemento categoryName');
    }
    
    if (selectCategoryNameSelect) {
        selectCategoryNameSelect.addEventListener('change', updateSelectSubcategoryDropdown);
        console.log('Event listener agregado a selectCategoryName');
    } else {
        console.error('No se encontró el elemento selectCategoryName');
    }

    // Filtros de transacciones
    const monthFilter = document.getElementById('monthFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (monthFilter) {
        monthFilter.addEventListener('change', filterTransactions);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterTransactions);
    }
    
    // Configurar pestañas de colaboración
    setupCollaborationTabs();
    
    // Filtros del historial
    const historyTypeFilter = document.getElementById('historyTypeFilter');
    const historyUserFilter = document.getElementById('historyUserFilter');
    
    if (historyTypeFilter) {
        historyTypeFilter.addEventListener('change', loadHistoryData);
    }
    
    if (historyUserFilter) {
        historyUserFilter.addEventListener('change', loadHistoryData);
    }
    
    // Botones de importación
    const importDataBtn = document.getElementById('importDataBtn');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    
    if (importDataBtn) {
        importDataBtn.addEventListener('click', importValidData);
    }
    
    if (cancelImportBtn) {
        cancelImportBtn.addEventListener('click', () => {
            closeModal('importModal');
            // Limpiar datos de importación
            importData = {
                file: null,
                parsedData: [],
                validRows: [],
                invalidRows: []
            };
            document.getElementById('previewContent').innerHTML = '<p class="no-preview">Sube un archivo para ver la vista previa</p>';
            document.getElementById('fileInfo').style.display = 'none';
        });
    }
    
    // Botón de reset de categorías
    const resetCategoriesBtn = document.getElementById('resetCategoriesBtn');
    if (resetCategoriesBtn) {
        resetCategoriesBtn.addEventListener('click', resetToDefaultCategories);
    }
    
    // Botones de depuración (solo para desarrollo)
    const debugTransactionsBtn = document.getElementById('debugTransactionsBtn');
    const resetTransactionsBtn = document.getElementById('resetTransactionsBtn');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    
    if (debugTransactionsBtn) {
        debugTransactionsBtn.addEventListener('click', debugTransactions);
    }
    
    if (resetTransactionsBtn) {
        resetTransactionsBtn.addEventListener('click', resetTransactionData);
    }
    
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            if (window.clearAppCache) {
                window.clearAppCache();
            } else {
                console.log('Función clearAppCache no disponible');
                // Fallback: recargar la página
                window.location.reload();
            }
        });
    }
    
    // Botón de sincronización en la nube
    const cloudSyncBtn = document.getElementById('cloudSyncBtn');
    console.log('🔍 Buscando botón de sincronización en la nube:', cloudSyncBtn);
    if (cloudSyncBtn) {
        console.log('✅ Botón de sincronización encontrado, agregando event listener');
        cloudSyncBtn.addEventListener('click', () => {
            console.log('🔄 Abriendo modal de sincronización en la nube');
            openModal('cloudSyncModal');
            setupCloudSyncTabs();
            updateSyncStatus();
        });
    } else {
        console.error('❌ Botón de sincronización en la nube NO encontrado');
        // Verificar si el elemento existe en el DOM
        setTimeout(() => {
            const retryCloudSyncBtn = document.getElementById('cloudSyncBtn');
            console.log('🔄 Reintentando buscar botón de sincronización:', retryCloudSyncBtn);
            if (retryCloudSyncBtn) {
                console.log('✅ Botón encontrado en segundo intento');
                retryCloudSyncBtn.addEventListener('click', () => {
                    openModal('cloudSyncModal');
                    setupCloudSyncTabs();
                    updateSyncStatus();
                });
            }
        }, 1000);
    }
    
    // Botón de backup
    const backupBtn = document.getElementById('backupBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', createBackup);
    }
    
    // Menú desplegable
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    
    console.log('🔍 Buscando elementos del menú:');
    console.log('Menu button:', menuBtn);
    console.log('Menu dropdown:', menuDropdown);
    
    if (menuBtn && menuDropdown) {
        console.log('✅ Elementos del menú encontrados, configurando event listener');
        menuBtn.addEventListener('click', (e) => {
            console.log('🔄 Clic en botón de menú');
            e.stopPropagation();
            menuDropdown.classList.toggle('show');
            console.log('🔄 Clase show toggleada:', menuDropdown.classList.contains('show'));
        });
    } else {
        console.error('❌ Elementos del menú NO encontrados');
    }
    
    // Cerrar menú al hacer clic fuera (solo si los elementos existen)
    if (menuBtn && menuDropdown) {
        document.addEventListener('click', (e) => {
            if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
                menuDropdown.classList.remove('show');
            }
        });
        
        // Cerrar menú al hacer clic en cualquier elemento del menú
        menuDropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('menu-item')) {
                menuDropdown.classList.remove('show');
            }
        });
    }
    
    // Event listener para ingresos recurrentes
    const incomeForm = document.getElementById('incomeForm');
    const incomeFrequencySelect = document.getElementById('incomeFrequency');
    
    if (incomeForm) {
        incomeForm.addEventListener('submit', handleIncomeSubmit);
    }
    
    if (incomeFrequencySelect) {
        incomeFrequencySelect.addEventListener('change', handleIncomeFrequencyChange);
    }
    
    // Event listener para botón de nuevo ingreso
    const addIncomeBtn = document.getElementById('addIncomeBtn');
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', () => {
            // Limpiar formulario
            document.getElementById('incomeForm').reset();
            document.getElementById('incomeModalTitle').textContent = 'Nuevo Ingreso Recurrente';
            delete document.getElementById('incomeForm').dataset.editId;
            
            // Inicializar fecha de inicio
            const today = new Date().toISOString().split('T')[0];
            const incomeStartDate = document.getElementById('incomeStartDate');
            if (incomeStartDate) {
                incomeStartDate.value = today;
            }
            
            openModal('incomeModal');
        });
    }
    
    // Event listeners para reportes avanzados
    const reportMonthAdvanced = document.getElementById('reportMonth');
    const reportType = document.getElementById('reportType');
    const exportReportBtn = document.getElementById('exportReportBtn');
    
    if (reportMonthAdvanced) {
        reportMonthAdvanced.addEventListener('change', updateAdvancedReports);
    }
    
    if (reportType) {
        reportType.addEventListener('change', updateAdvancedReports);
    }
    
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', exportReport);
    }
}

function switchTab(tabName) {
    // Remover clase active de todos los botones y contenidos
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Agregar clase active al botón y contenido seleccionado
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    // Actualizar contenido específico de la pestaña
    if (tabName === 'reportes') {
        updateReports();
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    
    // Actualizar dropdowns cuando se abre un modal que los usa
    if (modalId === 'categoryModal' || modalId === 'transactionModal' || modalId === 'selectCategoryModal') {
        updateCategoryDropdowns();
        updateCategorySelect();
        updateCategoryFilters();
        
        // Forzar actualización de subcategorías después de un pequeño delay
        setTimeout(() => {
            updateSubcategoryDropdown();
            updateSelectSubcategoryDropdown();
        }, 100);
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Limpiar formularios
    if (modalId === 'categoryModal') {
        categoryForm.reset();
        // Resetear el formulario a modo creación
        delete categoryForm.dataset.editId;
        document.getElementById('categoryModalTitle').textContent = 'Nueva Categoría';
        const submitBtn = document.querySelector('#categoryForm .btn-primary');
        submitBtn.textContent = 'Guardar';
        // Establecer fecha actual en el campo de fecha recurrente
        document.getElementById('categoryRecurringDate').value = new Date().toISOString().split('T')[0];
        // Resetear dropdowns
        document.getElementById('categoryName').value = '';
        document.getElementById('categorySubcategory').value = '';
        updateSubcategoryDropdown();
    } else if (modalId === 'selectCategoryModal') {
        // Resetear formulario de selección de categorías
        document.getElementById('selectCategoryName').value = '';
        document.getElementById('selectSubcategoryName').value = '';
        document.getElementById('selectCategoryBudget').value = '';
        document.getElementById('selectCategoryRecurringDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('selectCategoryColor').value = '#007bff';
        updateSelectSubcategoryDropdown();
    } else if (modalId === 'transactionModal') {
        transactionForm.reset();
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        // Resetear el formulario a modo creación
        delete transactionForm.dataset.editId;
        document.getElementById('transactionModalTitle').textContent = 'Nueva Transacción';
        const submitBtn = document.querySelector('#transactionForm .btn-primary');
        submitBtn.textContent = 'Guardar';
    }
}

function handleCategorySubmit(e) {
    e.preventDefault();
    
    const categoryId = document.getElementById('categoryForm').dataset.editId;
    
    if (categoryId) {
        // Editar categoría existente
        const categoryIndex = categories.findIndex(cat => cat.id === parseInt(categoryId));
        if (categoryIndex !== -1) {
            const categoryName = document.getElementById('categoryName').value;
            const frequency = document.getElementById('categoryRecurringFrequency').value;
            const customDays = frequency === 'custom' ? parseInt(document.getElementById('categoryCustomDays').value) : null;
            
            categories[categoryIndex] = {
                ...categories[categoryIndex],
                name: categoryName,
                subcategory: document.getElementById('categorySubcategory').value || null,
                budget: parseFloat(document.getElementById('categoryBudget').value),
                recurringDate: document.getElementById('categoryRecurringDate').value,
                frequency: frequency,
                customDays: customDays,
                color: getCategoryColor(categoryName)
            };
        }
        delete document.getElementById('categoryForm').dataset.editId;
    } else {
        // Crear nueva categoría
        const categoryName = document.getElementById('categoryName').value;
        const subcategoryName = document.getElementById('categorySubcategory').value || null;
        const frequency = document.getElementById('categoryRecurringFrequency').value;
        const customDays = frequency === 'custom' ? parseInt(document.getElementById('categoryCustomDays').value) : null;
        
        // Usar el color de la categoría principal
        const categoryColor = getCategoryColor(categoryName);
        
        const categoryData = {
            id: Date.now(),
            name: categoryName,
            subcategory: subcategoryName,
            budget: parseFloat(document.getElementById('categoryBudget').value),
            recurringDate: document.getElementById('categoryRecurringDate').value,
            frequency: frequency,
            customDays: customDays,
            color: categoryColor,
            spent: 0
        };
        categories.push(categoryData);
        
        // Agregar a los grupos si no existe
        if (!categoryGroups[categoryData.name]) {
            categoryGroups[categoryData.name] = [];
        }
        if (categoryData.subcategory && !categoryGroups[categoryData.name].includes(categoryData.subcategory)) {
            categoryGroups[categoryData.name].push(categoryData.subcategory);
        }
        saveCategoryGroups();
    }

    saveData();
    addToHistory('Categoría', categoryId ? `Editó categoría: ${document.getElementById('categoryName').value}` : `Agregó categoría: ${document.getElementById('categoryName').value}`, 'category');
    clearCaches(); // Limpiar caches cuando se actualicen datos
    updateUI();
    closeModal('categoryModal');
    
    // Mostrar confirmación
    const categoryName = document.getElementById('categoryName').value;
    showVisualNotification(
        categoryId ? 'Categoría actualizada' : 'Categoría agregada',
        `La categoría "${categoryName}" se ha ${categoryId ? 'actualizado' : 'agregado'} correctamente.`,
        'budget'
    );
}

function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const description = document.getElementById('transactionDescription').value.trim();
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const type = document.getElementById('transactionType').value;
    const category = document.getElementById('transactionCategory').value;
    const date = document.getElementById('transactionDate').value;
    const comment = document.getElementById('transactionComment').value.trim();
    const editId = transactionForm.dataset.editId;
    
    if (!description || !amount || !category || !date) {
        alert('Por favor completa todos los campos requeridos.');
        return;
    }
    
    if (editId) {
        // Editar transacción existente
        const transactionIndex = transactions.findIndex(t => t.id === parseInt(editId));
        if (transactionIndex !== -1) {
            const oldTransaction = transactions[transactionIndex];
            
            // Ajustar spent en categorías
            if (oldTransaction.type === 'gasto') {
                const oldCategory = categories.find(c => c.name === oldTransaction.category);
                if (oldCategory) {
                    oldCategory.spent -= oldTransaction.amount;
                }
            }
            
            // Actualizar transacción
            transactions[transactionIndex] = {
                ...oldTransaction,
                description,
                amount,
                type,
                category,
                date,
                comment: comment || null,
                lastModifiedBy: currentUser,
                lastModifiedAt: new Date().toISOString()
            };
            
            // Ajustar spent en nueva categoría si es gasto
            if (type === 'gasto') {
                const newCategory = categories.find(c => c.name === category);
                if (newCategory) {
                    newCategory.spent += amount;
                }
            }
            
            // Registrar en historial
            addToHistory(
                'Editó transacción',
                `${description} - ${formatCurrency(amount)} (${type})`,
                'transaction'
            );
            
            // Limpiar modo edición
            transactionForm.removeAttribute('data-edit-id');
            document.getElementById('transactionModalTitle').textContent = 'Nueva Transacción';
            const submitBtn = transactionForm.querySelector('.btn-primary');
            submitBtn.textContent = 'Guardar';
        }
    } else {
        // Crear nueva transacción
        const newTransaction = {
            id: Date.now(),
            description,
            amount,
            type,
            category,
            date,
            comment: comment || null,
            createdBy: currentUser,
            createdAt: new Date().toISOString(),
            lastModifiedBy: currentUser,
            lastModifiedAt: new Date().toISOString()
        };
        
        transactions.push(newTransaction);
        
        // Ajustar spent en categoría si es gasto
        if (type === 'gasto') {
            const category = categories.find(c => c.name === newTransaction.category);
            if (category) {
                category.spent += amount;
            }
        }
        
        // Registrar en historial
        addToHistory(
            'Agregó transacción',
            `${description} - ${formatCurrency(amount)} (${type})`,
            'transaction'
        );
    }
    
    saveData();
    clearCaches();
    
    // Mostrar confirmación visual
    showVisualNotification(
        editId ? 'Transacción actualizada' : 'Transacción agregada',
        `La transacción "${description}" se ha ${editId ? 'actualizado' : 'agregado'} correctamente.`,
        'budget'
    );
    
    // Cerrar modal y limpiar formulario
    closeModal('transactionModal');
    transactionForm.reset();
    
    // Actualizar UI completa
    updateUI(true);
    
    // Forzar actualización específica de transacciones
    setTimeout(() => {
        console.log('Forzando actualización de transacciones...');
        updateGastosIngresosDisplay();
        filterTransactions(); // Aplicar filtros actuales
    }, 200);
}

function updateCategoryDropdowns() {
    console.log('Actualizando dropdowns de categorías...');
    console.log('Categorías disponibles:', Object.keys(categoryGroups));
    
    // Actualizar dropdown de categorías
    const categorySelect = document.getElementById('categoryName');
    if (!categorySelect) {
        console.error('No se encontró el elemento categoryName');
        return;
    }
    
    categorySelect.innerHTML = '<option value="">Seleccionar o crear categoría</option>';
    
    Object.keys(categoryGroups).forEach(categoryName => {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        categorySelect.appendChild(option);
    });
    
    console.log(`Dropdown de categorías actualizado con ${Object.keys(categoryGroups).length} categorías`);
    
    // Actualizar dropdown de subcategorías
    updateSubcategoryDropdown();
    
    // Actualizar dropdown de selección de categorías
    updateSelectCategoryDropdown();
}

function updateSubcategoryDropdown() {
    console.log('Actualizando dropdown de subcategorías...');
    
    const subcategorySelect = document.getElementById('categorySubcategory');
    const selectedCategory = document.getElementById('categoryName').value;
    
    console.log('Categoría seleccionada:', selectedCategory);
    console.log('Subcategorías disponibles:', selectedCategory ? categoryGroups[selectedCategory] : 'Ninguna');
    
    if (!subcategorySelect) {
        console.error('No se encontró el elemento categorySubcategory');
        return;
    }
    
    subcategorySelect.innerHTML = '<option value="">Seleccionar o crear subcategoría</option>';
    
    if (selectedCategory && categoryGroups[selectedCategory]) {
        categoryGroups[selectedCategory].forEach(subcategory => {
            const option = document.createElement('option');
            option.value = subcategory;
            option.textContent = subcategory;
            subcategorySelect.appendChild(option);
        });
        console.log(`Dropdown de subcategorías actualizado con ${categoryGroups[selectedCategory].length} opciones`);
    } else {
        console.log('No hay subcategorías para mostrar');
    }
}

function updateSelectCategoryDropdown() {
    const selectCategorySelect = document.getElementById('selectCategoryName');
    selectCategorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
    
    Object.keys(categoryGroups).forEach(categoryName => {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        selectCategorySelect.appendChild(option);
    });
}

function updateSelectSubcategoryDropdown() {
    console.log('Actualizando dropdown de subcategorías para selección...');
    
    const subcategorySelect = document.getElementById('selectSubcategoryName');
    const selectedCategory = document.getElementById('selectCategoryName').value;
    
    console.log('Categoría seleccionada en select:', selectedCategory);
    console.log('Subcategorías disponibles:', selectedCategory ? categoryGroups[selectedCategory] : 'Ninguna');
    
    if (!subcategorySelect) {
        console.error('No se encontró el elemento selectSubcategoryName');
        return;
    }
    
    subcategorySelect.innerHTML = '<option value="">Seleccionar subcategoría</option>';
    
    if (selectedCategory && categoryGroups[selectedCategory]) {
        categoryGroups[selectedCategory].forEach(subcategory => {
            const option = document.createElement('option');
            option.value = subcategory;
            option.textContent = subcategory;
            subcategorySelect.appendChild(option);
        });
        console.log(`Dropdown de subcategorías de selección actualizado con ${categoryGroups[selectedCategory].length} opciones`);
    } else {
        console.log('No hay subcategorías para mostrar en selección');
    }
}

function updateCategorySelect() {
    console.log('Actualizando dropdown de categorías para transacciones...');
    
    const categorySelect = document.getElementById('transactionCategory');
    if (!categorySelect) {
        console.error('No se encontró el elemento transactionCategory');
        return;
    }
    
    // Limpiar opciones existentes
    categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';
    
    // Obtener el tipo de transacción actual
    const transactionType = document.getElementById('transactionType').value;
    
    // Mostrar categorías según el tipo
    if (transactionType === 'ingreso') {
        // Mostrar categorías de ingresos
        Object.keys(defaultIncomeCategories).forEach(categoryName => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
        });
        console.log(`Categorías de ingresos cargadas: ${categorySelect.options.length - 1}`);
    } else {
        // Mostrar categorías de gastos (excluyendo las de ingresos)
        Object.keys(categoryGroups).forEach(categoryName => {
            // Excluir categorías de ingresos del dropdown de gastos
            if (!defaultIncomeCategories[categoryName]) {
                const option = document.createElement('option');
                option.value = categoryName;
                option.textContent = categoryName;
                categorySelect.appendChild(option);
            }
        });
        console.log(`Categorías de gastos cargadas: ${categorySelect.options.length - 1}`);
    }
    
    console.log(`Categorías cargadas para ${transactionType}:`, categorySelect.options.length - 1);
}

function updateCategoryFilters() {
    console.log('Actualizando filtros de categorías...');
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) {
        console.error('No se encontró el elemento categoryFilter');
        return;
    }
    
    categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    
    // Mostrar todas las categorías disponibles para el filtro
    Object.keys(categoryGroups).forEach(categoryName => {
        // Para categorías principales, mostrar solo el nombre
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        categoryFilter.appendChild(option);
        
        // Para subcategorías, mostrar con formato "Categoría - Subcategoría"
        if (categoryGroups[categoryName] && Array.isArray(categoryGroups[categoryName])) {
            categoryGroups[categoryName].forEach(subcategory => {
                const subOption = document.createElement('option');
                subOption.value = `${categoryName} - ${subcategory}`;
                subOption.textContent = `${categoryName} - ${subcategory}`;
                categoryFilter.appendChild(subOption);
            });
        }
    });
    
    console.log(`Filtros de categorías actualizados: ${categoryFilter.options.length - 1} opciones`);
}

function getDefaultColor(categoryName) {
    return defaultColors[categoryName] || '#007aff';
}

// Cache para colores de categorías
const colorCache = new Map();

// Función para limpiar caches cuando sea necesario
function clearCaches() {
    currencyCache.clear();
    colorCache.clear();
}

// Función para obtener el color de una categoría basado en su nombre principal
function getCategoryColor(categoryName) {
    // Verificar cache primero
    if (colorCache.has(categoryName)) {
        return colorCache.get(categoryName);
    }
    
    let color = '#007aff'; // Color por defecto
    
    // Si es una categoría principal, usar su color por defecto
    if (defaultColors[categoryName]) {
        color = defaultColors[categoryName];
    } else {
        // Si es una subcategoría, buscar la categoría principal a la que pertenece
        for (const [mainCategory, subcategories] of Object.entries(categoryGroups)) {
            if (subcategories.includes(categoryName)) {
                color = defaultColors[mainCategory] || '#007aff';
                break;
            }
        }
    }
    
    // Guardar en cache
    colorCache.set(categoryName, color);
    return color;
}

function showAddCategoryInput() {
    const categorySelect = document.getElementById('categoryName');
    const newCategory = prompt('Ingresa el nombre de la nueva categoría:');
    
    if (newCategory && newCategory.trim()) {
        const trimmedCategory = newCategory.trim();
        
        if (!categoryGroups[trimmedCategory]) {
            categoryGroups[trimmedCategory] = [];
            saveCategoryGroups();
            updateCategoryDropdowns();
            categorySelect.value = trimmedCategory;
            updateSubcategoryDropdown();
        } else {
            alert('Esta categoría ya existe.');
        }
    }
}

function showAddSubcategoryInput() {
    const categorySelect = document.getElementById('categoryName');
    const subcategorySelect = document.getElementById('categorySubcategory');
    
    if (!categorySelect.value) {
        alert('Primero selecciona una categoría.');
        return;
    }
    
    const newSubcategory = prompt('Ingresa el nombre de la nueva subcategoría:');
    
    if (newSubcategory && newSubcategory.trim()) {
        const trimmedSubcategory = newSubcategory.trim();
        const categoryName = categorySelect.value;
        
        if (!categoryGroups[categoryName].includes(trimmedSubcategory)) {
            categoryGroups[categoryName].push(trimmedSubcategory);
            saveCategoryGroups();
            updateSubcategoryDropdown();
            subcategorySelect.value = trimmedSubcategory;
        } else {
            alert('Esta subcategoría ya existe en esta categoría.');
        }
    }
}

function updateMonthFilters() {
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort().reverse();
    const monthFilter = document.getElementById('monthFilter');
    const reportMonth = document.getElementById('reportMonth');
    const budgetMonth = document.getElementById('budgetMonth');
    
    monthFilter.innerHTML = '<option value="">Todos los meses</option>';
    reportMonth.innerHTML = '<option value="">Todos los meses</option>';
    budgetMonth.innerHTML = '<option value="">Mes actual</option>';
    
    months.forEach(month => {
        const monthName = new Date(month + '-01').toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long' 
        });
        
        const option1 = document.createElement('option');
        option1.value = month;
        option1.textContent = monthName;
        monthFilter.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = month;
        option2.textContent = monthName;
        reportMonth.appendChild(option2);
        
        const option3 = document.createElement('option');
        option3.value = month;
        option3.textContent = monthName;
        budgetMonth.appendChild(option3);
    });
}

// Cache para evitar actualizaciones innecesarias
let lastUpdateTime = 0;
let updateTimeout = null;

function updateUI(forceUpdate = false) {
    if (forceUpdate) {
        clearCaches();
    }
    
    updateBudgetSummary();
    updateIncomesDisplay();
    updateGastosIngresosDisplay();
    updateReports();
    
    // Actualizar dropdowns solo si es necesario
    if (forceUpdate || !document.getElementById('categoryName').options.length) {
        updateCategorySelect();
        updateCategoryDropdowns();
        updateCategoryFilters();
    }
    
    // Actualizar filtros solo si es necesario
    if (forceUpdate || !document.getElementById('monthFilter').options.length) {
        updateMonthFilters();
        updateCategoryFilters();
    }
}

function updateBudgetSummary() {
    const selectedMonth = document.getElementById('budgetMonth').value;
    
    // Si no hay mes seleccionado, usar todas las categorías
    let categoriesToShow = categories;
    let totalBudget = categories.reduce((sum, cat) => {
        // Calcular el presupuesto ajustado según la frecuencia
        const adjustedBudget = calculateAdjustedBudget(cat.budget, cat.frequency || 'monthly', cat.customDays);
        return sum + adjustedBudget;
    }, 0);
    let totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
    
    // Calcular ingresos totales
    const totalIncomes = calculateTotalIncomes();
    const balance = totalIncomes - totalSpent;
    
    if (selectedMonth) {
        // Filtrar transacciones por mes seleccionado
        const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
        
        // Calcular gastos por categoría para el mes seleccionado
        const spentByCategory = {};
        monthTransactions.forEach(transaction => {
            if (transaction.type === 'gasto') {
                const categoryName = transaction.category;
                if (!spentByCategory[categoryName]) {
                    spentByCategory[categoryName] = 0;
                }
                spentByCategory[categoryName] += transaction.amount;
            }
        });
        
        // Actualizar spent en las categorías para mostrar
        categoriesToShow = categories.map(category => ({
            ...category,
            spent: spentByCategory[category.name] || 0
        }));
        
        // Recalcular totales con presupuesto ajustado
        totalBudget = categoriesToShow.reduce((sum, cat) => {
            const adjustedBudget = calculateAdjustedBudget(cat.budget, cat.frequency || 'monthly', cat.customDays);
            return sum + adjustedBudget;
        }, 0);
        totalSpent = categoriesToShow.reduce((sum, cat) => sum + cat.spent, 0);
        
        // Recalcular balance
        const balance = totalIncomes - totalSpent;
    }
    
    const totalRemaining = totalBudget - totalSpent;

    document.getElementById('totalBudget').textContent = formatCurrency(totalBudget);
    document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
    document.getElementById('totalRemaining').textContent = formatCurrency(totalRemaining);
    document.getElementById('totalIncomes').textContent = formatCurrency(totalIncomes);
    document.getElementById('totalBalance').textContent = formatCurrency(balance);
    
    // Actualizar la visualización de categorías con los datos filtrados
    updateCategoriesDisplayForMonth(categoriesToShow);
    
    // Actualizar el título para mostrar el mes seleccionado
    const budgetTitle = document.querySelector('#presupuesto .section-header h2');
    if (budgetTitle) {
        if (selectedMonth) {
            const monthName = new Date(selectedMonth + '-01').toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long' 
            });
            budgetTitle.textContent = `Presupuesto - ${monthName}`;
        } else {
            budgetTitle.textContent = 'Presupuesto Mensual';
        }
    }
    
    // ALERTA VISUAL EN TARJETA DE GASTADO
    const spentCard = document.querySelector('.summary-card:nth-child(2)');
    if (spentCard) {
        spentCard.classList.remove('alert', 'critical');
        if (totalBudget > 0) {
            const percent = totalSpent / totalBudget;
            if (percent >= 1) {
                spentCard.classList.add('critical');
            } else if (percent >= 0.9) {
                spentCard.classList.add('alert');
            }
        }
    }
    
    // Verificar alertas de presupuesto
    checkBudgetAlerts();
}

// Función para actualizar el presupuesto cuando cambie el mes
function updateBudgetForMonth() {
    updateBudgetSummary();
}

// Función para actualizar la visualización de categorías con datos del mes seleccionado
function updateCategoriesDisplayForMonth(categoriesToShow) {
    updateCategoriesDisplay(categoriesToShow);
}

function updateCategoriesDisplay(categoriesToShow = null) {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';

    // Usar categorías proporcionadas o todas las categorías
    const categoriesToDisplay = categoriesToShow || categories;

    if (categoriesToDisplay.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay categorías configuradas. Agrega una nueva categoría para comenzar.</p>';
        return;
    }

    // Agrupar categorías por nombre principal
    const groupedCategories = {};
    categoriesToDisplay.forEach(category => {
        if (!groupedCategories[category.name]) {
            groupedCategories[category.name] = [];
        }
        groupedCategories[category.name].push(category);
    });

    // Crear grupos de categorías compactos
    Object.keys(groupedCategories).forEach(categoryName => {
        const categoryGroup = groupedCategories[categoryName];
        const totalBudget = categoryGroup.reduce((sum, cat) => {
            const adjustedBudget = calculateAdjustedBudget(cat.budget, cat.frequency || 'monthly', cat.customDays);
            return sum + adjustedBudget;
        }, 0);
        const totalSpent = categoryGroup.reduce((sum, cat) => sum + cat.spent, 0);
        const totalRemaining = totalBudget - totalSpent;
        const percentage = (totalSpent / totalBudget) * 100;
        
        // Crear contenedor del grupo
        const groupContainer = document.createElement('div');
        groupContainer.className = 'category-group';
        groupContainer.style.marginBottom = '12px';
        groupContainer.style.border = '1px solid #e0e0e0';
        groupContainer.style.borderRadius = '8px';
        groupContainer.style.overflow = 'hidden';
        groupContainer.style.cursor = 'pointer';
        groupContainer.style.transition = 'all 0.3s ease';
        
        // Usar el color de la categoría principal
        const groupColor = getCategoryColor(categoryName);
        
        // Crear header del grupo con información resumida
        const groupHeader = document.createElement('div');
        groupHeader.style.background = '#f8f9fa';
        groupHeader.style.padding = '16px';
        groupHeader.style.borderBottom = '1px solid #e0e0e0';
        groupHeader.style.fontWeight = '600';
        groupHeader.style.fontSize = '16px';
        groupHeader.style.color = '#333';
        groupHeader.style.display = 'flex';
        groupHeader.style.justifyContent = 'space-between';
        groupHeader.style.alignItems = 'center';
        
        groupHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas fa-chevron-right" style="color: #666; transition: transform 0.3s ease;" id="chevron-${categoryName.replace(/\s+/g, '-')}"></i>
                <span style="color: ${groupColor}">${categoryName}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="text-align: right;">
                    <div style="font-size: 14px; color: #666;">Presupuesto</div>
                    <div style="font-weight: 600; color: #333;">${formatCurrency(totalBudget)}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 14px; color: #666;">Gastado</div>
                    <div style="font-weight: 600; color: ${totalSpent > totalBudget ? '#ff3b30' : '#34c759'}">${formatCurrency(totalSpent)}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 14px; color: #666;">Restante</div>
                    <div style="font-weight: 600; color: ${totalRemaining < 0 ? '#ff3b30' : '#333'}">${formatCurrency(totalRemaining)}</div>
                </div>
            </div>
        `;
        
        groupContainer.appendChild(groupHeader);
        
        // Crear contenedor para las subcategorías (inicialmente oculto)
        const subcategoriesContainer = document.createElement('div');
        subcategoriesContainer.style.display = 'none';
        subcategoriesContainer.style.padding = '12px';
        subcategoriesContainer.style.background = '#fff';
        subcategoriesContainer.style.borderTop = '1px solid #e0e0e0';
        
        // Agregar cada subcategoría del grupo
        categoryGroup.forEach(category => {
            // Calcular el presupuesto ajustado según la frecuencia
            const adjustedBudget = calculateAdjustedBudget(category.budget, category.frequency || 'monthly', category.customDays);
            const subcategoryPercentage = (category.spent / adjustedBudget) * 100;
            const subcategoryRemaining = adjustedBudget - category.spent;
            const frequencyText = category.frequency ? getFrequencyText(category.frequency, category.customDays) : 'Mensual';
            const nextRecurrence = category.recurringDate && category.frequency ? 
                getNextRecurrenceDate(category.recurringDate, category.frequency, category.customDays) : null;
            const recurringDateText = category.recurringDate ? 
                `<span class="category-recurring">${frequencyText} - Próximo: ${formatDate(nextRecurrence || category.recurringDate)}</span>` : '';
            
            // Mostrar el presupuesto base y el ajustado
            const budgetDisplay = category.frequency && category.frequency !== 'monthly' ? 
                `${formatCurrency(category.budget)} → ${formatCurrency(adjustedBudget)}` : 
                formatCurrency(category.budget);
            
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.style.margin = '8px 0';
            categoryCard.style.border = '1px solid #e0e0e0';
            categoryCard.style.borderRadius = '6px';
            categoryCard.style.padding = '12px';
            categoryCard.style.background = '#fff';
            
            categoryCard.innerHTML = `
                <div class="category-header">
                    <div class="category-info">
                        <span class="category-name" style="color: ${groupColor}">${category.subcategory || 'Sin subcategoría'}</span>
                        <span class="category-budget">${budgetDisplay}</span>
                        ${recurringDateText}
                    </div>
                    <div class="category-actions">
                        <button class="btn-icon edit-category" data-id="${category.id}" title="Editar categoría">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-category" data-id="${category.id}" title="Eliminar categoría">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(subcategoryPercentage, 100)}%; background: ${groupColor}"></div>
                </div>
                <div class="category-stats">
                    <span>Gastado: ${formatCurrency(category.spent)}</span>
                    <span>Restante: ${formatCurrency(subcategoryRemaining)}</span>
                </div>
            `;
            // ALERTA VISUAL EN TARJETA DE CATEGORÍA
            categoryCard.classList.remove('alert', 'critical');
            if (adjustedBudget > 0) {
                const percent = category.spent / adjustedBudget;
                if (percent >= 1) {
                    categoryCard.classList.add('critical');
                } else if (percent >= 0.9) {
                    categoryCard.classList.add('alert');
                }
            }
            
            subcategoriesContainer.appendChild(categoryCard);
        });
        
        // Agregar barra de progreso del grupo
        const progressContainer = document.createElement('div');
        progressContainer.style.padding = '0 16px 16px 16px';
        progressContainer.style.background = '#f8f9fa';
        progressContainer.innerHTML = `
            <div class="progress-bar" style="height: 8px; border-radius: 4px; background: #e0e0e0; overflow: hidden;">
                <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background: ${groupColor}; height: 100%; transition: width 0.3s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #666;">
                <span>0%</span>
                <span>${Math.round(percentage)}%</span>
                <span>100%</span>
            </div>
        `;
        
        groupContainer.appendChild(progressContainer);
        groupContainer.appendChild(subcategoriesContainer);
        container.appendChild(groupContainer);
        
        // Agregar event listener para expandir/colapsar
        groupHeader.addEventListener('click', () => {
            const isExpanded = subcategoriesContainer.style.display === 'block';
            const chevron = document.getElementById(`chevron-${categoryName.replace(/\s+/g, '-')}`);
            
            if (isExpanded) {
                subcategoriesContainer.style.display = 'none';
                chevron.style.transform = 'rotate(0deg)';
                groupContainer.style.background = '#f8f9fa';
            } else {
                subcategoriesContainer.style.display = 'block';
                chevron.style.transform = 'rotate(90deg)';
                groupContainer.style.background = '#fff';
            }
        });
    });
    
    // Agregar event listeners para los botones de editar y eliminar
    document.querySelectorAll('.edit-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que se expanda/colapse al editar
            const categoryId = parseInt(e.currentTarget.dataset.id);
            editCategory(categoryId);
        });
    });
    
    document.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que se expanda/colapse al eliminar
            const categoryId = parseInt(e.currentTarget.dataset.id);
            deleteCategory(categoryId);
        });
    });
}

function updateGastosIngresosDisplay(transactionsToShow = null) {
    console.log('Actualizando visualización de transacciones...');
    console.log('Transacciones totales:', transactions.length);
    
    const gastosContainer = document.getElementById('gastosContainer');
    const ingresosContainer = document.getElementById('ingresosContainer');
    
    if (!gastosContainer || !ingresosContainer) {
        console.error('No se encontraron los contenedores de transacciones');
        return;
    }
    
    // Limpiar contenedores
    gastosContainer.innerHTML = '';
    ingresosContainer.innerHTML = '';
    
    const transactionsToDisplay = transactionsToShow || transactions;
    console.log('Transacciones a mostrar:', transactionsToDisplay.length);
    
    // Filtrar transacciones por tipo
    const gastos = transactionsToDisplay.filter(t => t.type === 'gasto');
    const ingresos = transactionsToDisplay.filter(t => t.type === 'ingreso');
    
    console.log('Gastos encontrados:', gastos.length);
    console.log('Ingresos encontrados:', ingresos.length);
    
    // Mostrar gastos
    if (gastos.length === 0) {
        gastosContainer.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay gastos registrados.</p>';
    } else {
        gastos.forEach(transaction => {
            const transactionItem = createTransactionItem(transaction);
            gastosContainer.appendChild(transactionItem);
        });
    }
    
    // Mostrar ingresos
    if (ingresos.length === 0) {
        ingresosContainer.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay ingresos registrados.</p>';
    } else {
        ingresos.forEach(transaction => {
            const transactionItem = createTransactionItem(transaction);
            ingresosContainer.appendChild(transactionItem);
        });
    }
    
    console.log('Visualización de transacciones actualizada');
}

function createTransactionItem(transaction) {
    const transactionItem = document.createElement('div');
    transactionItem.className = 'transaction-item';
    const date = new Date(transaction.date).toLocaleDateString('es-ES');
    const amountClass = transaction.type === 'ingreso' ? 'income' : 'expense';
    const amountPrefix = transaction.type === 'ingreso' ? '+' : '-';
    const authorInfo = transaction.lastModifiedBy ? `<div class="transaction-author">por ${transaction.lastModifiedBy}</div>` : '';
    const commentHtml = transaction.comment ? `<div class="transaction-comment"><div class="transaction-comment-author">${transaction.lastModifiedBy || 'Usuario'}</div>${transaction.comment}</div>` : '';
    transactionItem.innerHTML = `
        <div class="transaction-description">
            <h4>${transaction.description}</h4>
            <div class="transaction-details">
                ${transaction.category} • ${date}
            </div>
            ${authorInfo}
            ${commentHtml}
        </div>
        <div class="transaction-buttons">
            <div class="transaction-amount ${amountClass}">
                ${amountPrefix}${formatCurrency(transaction.amount)}
            </div>
            <div class="transaction-actions">
                <button class="btn-icon edit-transaction" data-id="${transaction.id}" title="Editar transacción">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-transaction" data-id="${transaction.id}" title="Eliminar transacción">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    // Event listeners para editar/eliminar
    transactionItem.querySelector('.edit-transaction').addEventListener('click', (e) => {
        const transactionId = parseInt(e.currentTarget.dataset.id);
        editTransaction(transactionId);
    });
    transactionItem.querySelector('.delete-transaction').addEventListener('click', (e) => {
        const transactionId = parseInt(e.currentTarget.dataset.id);
        deleteTransaction(transactionId);
    });
    return transactionItem;
}

// Cache para transacciones filtradas
let filteredTransactionsCache = null;
let lastFilterState = '';

function filterTransactions() {
    console.log('Aplicando filtros de transacciones...');
    
    const monthFilter = document.getElementById('monthFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    const currentFilterState = `${monthFilter}-${categoryFilter}`;
    
    if (currentFilterState === lastFilterState && filteredTransactionsCache) {
        console.log('Usando cache de filtros');
        return;
    }
    
    lastFilterState = currentFilterState;
    
    let filtered = [...transactions]; // Crear copia para no modificar el original
    
    console.log('Transacciones antes de filtrar:', filtered.length);
    
    if (monthFilter) {
        filtered = filtered.filter(t => t.date.startsWith(monthFilter));
        console.log('Transacciones después de filtro de mes:', filtered.length);
    }
    
    if (categoryFilter) {
        filtered = filtered.filter(t => t.category === categoryFilter);
        console.log('Transacciones después de filtro de categoría:', filtered.length);
    }
    
    // Ordenar por fecha (más reciente primero)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredTransactionsCache = filtered;
    console.log('Transacciones filtradas finales:', filtered.length);
    
    updateGastosIngresosDisplay(filtered);
}

function updateReports() {
    console.log('=== ACTUALIZANDO REPORTES ===');
    console.log('Transacciones disponibles:', transactions);
    console.log('Formato de fechas de ejemplo:', transactions.slice(0, 3).map(t => t.date));
    
    updateMonthlySummary();
    updateCharts();
    updateAdvancedReports();
}

function updateMonthlySummary() {
    const selectedMonth = document.getElementById('reportMonth').value;
    let filteredTransactions = transactions;
    
    console.log('Mes seleccionado en reportes:', selectedMonth);
    console.log('Total de transacciones:', transactions.length);
    
    if (selectedMonth) {
        // Verificar que el formato de fecha sea correcto
        const monthPattern = new RegExp(`^${selectedMonth.replace('-', '-')}`);
        filteredTransactions = transactions.filter(t => {
            const matches = monthPattern.test(t.date);
            console.log(`Transacción ${t.date} - Patrón ${monthPattern} - Coincide: ${matches}`);
            return matches;
        });
        console.log('Transacciones filtradas por mes:', filteredTransactions.length);
        console.log('Transacciones del mes:', filteredTransactions);
    } else {
        console.log('No hay mes seleccionado, mostrando todas las transacciones');
    }

    const income = filteredTransactions
        .filter(t => t.type === 'ingreso')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
        .filter(t => t.type === 'gasto')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;

    console.log('Resumen calculado:', { income, expenses, balance });

    document.getElementById('monthlyIncome').textContent = formatCurrency(income);
    document.getElementById('monthlyExpenses').textContent = formatCurrency(expenses);
    document.getElementById('monthlyBalance').textContent = formatCurrency(balance);
    document.getElementById('monthlyBalance').className = `value ${balance >= 0 ? 'income' : 'expense'}`;
}

function updateCharts() {
    updateCategoryChart();
    updateMonthlyChart();
}

function updateCategoryChart() {
    const selectedMonth = document.getElementById('reportMonth').value;
    let filteredTransactions = transactions.filter(t => t.type === 'gasto');
    
    console.log('Mes seleccionado para gráfico de categorías:', selectedMonth);
    console.log('Transacciones de gastos totales:', filteredTransactions.length);
    
    if (selectedMonth) {
        filteredTransactions = filteredTransactions.filter(t => t.date.startsWith(selectedMonth));
        console.log('Transacciones de gastos filtradas por mes:', filteredTransactions.length);
    }

    const categoryData = {};
    filteredTransactions.forEach(transaction => {
        if (categoryData[transaction.category]) {
            categoryData[transaction.category] += transaction.amount;
        } else {
            categoryData[transaction.category] = transaction.amount;
        }
    });

    const ctx = document.getElementById('categoryChart');
    if (window.categoryChart && typeof window.categoryChart.destroy === 'function') {
        window.categoryChart.destroy();
    }

    if (Object.keys(categoryData).length === 0) {
        ctx.style.display = 'none';
        return;
    }

    ctx.style.display = 'block';
    
    const colors = categories.map(cat => cat.color);
    
    window.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: colors,
                borderWidth: 0,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function updateMonthlyChart() {
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort();
    const monthlyData = {
        income: [],
        expenses: []
    };

    console.log('Meses disponibles para gráfico:', months);
    console.log('Total de transacciones:', transactions.length);

    months.forEach(month => {
        const monthTransactions = transactions.filter(t => t.date.startsWith(month));
        const income = monthTransactions
            .filter(t => t.type === 'ingreso')
            .reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthTransactions
            .filter(t => t.type === 'gasto')
            .reduce((sum, t) => sum + t.amount, 0);
        
        console.log(`Mes ${month}:`, { income, expenses, transactions: monthTransactions.length });
        
        monthlyData.income.push(income);
        monthlyData.expenses.push(expenses);
    });

    const ctx = document.getElementById('monthlyChart');
    if (window.monthlyChart && typeof window.monthlyChart.destroy === 'function') {
        window.monthlyChart.destroy();
    }

    if (months.length === 0) {
        ctx.style.display = 'none';
        return;
    }

    ctx.style.display = 'block';
    
    const monthLabels = months.map(month => {
        return new Date(month + '-01').toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short' 
        });
    });

    window.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: monthlyData.income,
                    backgroundColor: '#34c759',
                    borderColor: '#34c759',
                    borderWidth: 0,
                    borderRadius: 4
                },
                {
                    label: 'Gastos',
                    data: monthlyData.expenses,
                    backgroundColor: '#ff3b30',
                    borderColor: '#ff3b30',
                    borderWidth: 0,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        },
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: '#e5e5e7'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Cache para formateo de moneda
const currencyCache = new Map();

function formatCurrency(amount) {
    const key = amount.toString();
    if (currencyCache.has(key)) {
        return currencyCache.get(key);
    }
    
    const formatted = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
    
    currencyCache.set(key, formatted);
    return formatted;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
    });
}

// Función para calcular la próxima fecha de recurrencia
function getNextRecurrenceDate(startDate, frequency, customDays = null) {
    const start = new Date(startDate);
    const now = new Date();
    let nextDate = new Date(start);
    
    // Calcular días según la frecuencia
    let daysToAdd = 0;
    switch (frequency) {
        case 'weekly':
            daysToAdd = 7;
            break;
        case 'biweekly':
            daysToAdd = 15;
            break;
        case 'monthly':
            daysToAdd = 30;
            break;
        case 'quarterly':
            daysToAdd = 90;
            break;
        case 'semiannual':
            daysToAdd = 180;
            break;
        case 'annual':
            daysToAdd = 365;
            break;
        case 'custom':
            daysToAdd = customDays || 30;
            break;
        default:
            daysToAdd = 30;
    }
    
    // Encontrar la próxima fecha después de hoy
    while (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + daysToAdd);
    }
    
    return nextDate.toISOString().split('T')[0];
}

// Función para obtener el texto de frecuencia
function getFrequencyText(frequency, customDays = null) {
    switch (frequency) {
        case 'weekly':
            return 'Semanal';
        case 'biweekly':
            return 'Quincenal';
        case 'monthly':
            return 'Mensual';
        case 'quarterly':
            return 'Trimestral';
        case 'semiannual':
            return 'Semestral';
        case 'annual':
            return 'Anual';
        case 'custom':
            return `Cada ${customDays || 30} días`;
        default:
            return 'Mensual';
    }
}

// Función para calcular el presupuesto ajustado según la frecuencia
function calculateAdjustedBudget(baseBudget, frequency, customDays = null) {
    const baseAmount = parseFloat(baseBudget);
    let multiplier = 1;
    
    switch (frequency) {
        case 'weekly':
            multiplier = 4.33; // Promedio de semanas por mes (52 semanas / 12 meses)
            break;
        case 'biweekly':
            multiplier = 2; // 2 veces por mes
            break;
        case 'monthly':
            multiplier = 1; // 1 vez por mes
            break;
        case 'quarterly':
            multiplier = 0.33; // 1 vez cada 3 meses (1/3 por mes)
            break;
        case 'semiannual':
            multiplier = 0.17; // 1 vez cada 6 meses (1/6 por mes)
            break;
        case 'annual':
            multiplier = 0.08; // 1 vez al año (1/12 por mes)
            break;
        case 'custom':
            const days = customDays || 30;
            multiplier = 30 / days; // Proporción de días por mes
            break;
        default:
            multiplier = 1;
    }
    
    return baseAmount * multiplier;
}

// Función para manejar cambios de frecuencia en el modal principal
function handleFrequencyChange() {
    const frequency = document.getElementById('categoryRecurringFrequency').value;
    const customGroup = document.getElementById('customFrequencyGroup');
    const customDaysInput = document.getElementById('categoryCustomDays');
    
    if (frequency === 'custom') {
        customGroup.style.display = 'block';
        customDaysInput.required = true;
    } else {
        customGroup.style.display = 'none';
        customDaysInput.required = false;
        customDaysInput.value = '';
    }
}

// Función para manejar cambios de frecuencia en el modal de selección
function handleSelectFrequencyChange() {
    const frequency = document.getElementById('selectCategoryRecurringFrequency').value;
    const customGroup = document.getElementById('selectCustomFrequencyGroup');
    const customDaysInput = document.getElementById('selectCategoryCustomDays');
    
    if (frequency === 'custom') {
        customGroup.style.display = 'block';
        customDaysInput.required = true;
    } else {
        customGroup.style.display = 'none';
        customDaysInput.required = false;
        customDaysInput.value = '';
    }
}

function saveData() {
    try {
        saveUserData();
    } catch (error) {
        console.error('Error al guardar datos:', error);
        alert('Error al guardar los datos. Verifica el espacio disponible en tu navegador.');
    }
}

function saveCategoryGroups() {
    try {
        saveUserData();
    } catch (error) {
        console.error('Error al guardar grupos de categorías:', error);
    }
}

function initializeDefaultCategories() {
    console.log('Inicializando categorías por defecto...');
    console.log('Categorías actuales:', Object.keys(categoryGroups));
    
    // Siempre cargar las categorías por defecto para que estén disponibles
    // Si no existen en categoryGroups, las agregamos
    Object.keys(defaultCategoryGroups).forEach(categoryName => {
        if (!categoryGroups[categoryName]) {
            categoryGroups[categoryName] = [...defaultCategoryGroups[categoryName]];
            console.log(`Agregada categoría: ${categoryName} con ${defaultCategoryGroups[categoryName].length} subcategorías`);
        } else {
            // Agregar subcategorías que no existan
            defaultCategoryGroups[categoryName].forEach(subcategory => {
                if (!categoryGroups[categoryName].includes(subcategory)) {
                    categoryGroups[categoryName].push(subcategory);
                    console.log(`Agregada subcategoría: ${subcategory} a ${categoryName}`);
                }
            });
        }
    });
    
    // Agregar categorías de ingresos al sistema de categorías
    Object.keys(defaultIncomeCategories).forEach(categoryName => {
        if (!categoryGroups[categoryName]) {
            categoryGroups[categoryName] = [...defaultIncomeCategories[categoryName]];
            console.log(`Agregada categoría de ingreso: ${categoryName} con ${defaultIncomeCategories[categoryName].length} subcategorías`);
        } else {
            // Agregar subcategorías que no existan
            defaultIncomeCategories[categoryName].forEach(subcategory => {
                if (!categoryGroups[categoryName].includes(subcategory)) {
                    categoryGroups[categoryName].push(subcategory);
                    console.log(`Agregada subcategoría de ingreso: ${subcategory} a ${categoryName}`);
                }
            });
        }
    });
    
    saveCategoryGroups();
    console.log('Categorías después de inicializar:', Object.keys(categoryGroups));
    
    // Solo crear categorías de presupuesto si no hay ninguna
    if (categories.length === 0) {
        console.log('Creando categorías de presupuesto por defecto...');
        // Crear algunas categorías de ejemplo con presupuestos
        const defaultCategories = [
            {
                id: Date.now() + 1,
                name: 'Alimentación y Bebidas',
                subcategory: 'Supermercado',
                budget: 12000,
                recurringDate: new Date().toISOString().split('T')[0],
                frequency: 'monthly',
                customDays: null,
                color: defaultColors['Alimentación y Bebidas'],
                spent: 0
            },
            {
                id: Date.now() + 2,
                name: 'Vivienda y Servicios',
                subcategory: 'Renta o hipoteca',
                budget: 18000,
                recurringDate: new Date().toISOString().split('T')[0],
                frequency: 'monthly',
                customDays: null,
                color: defaultColors['Vivienda y Servicios'],
                spent: 0
            },
            {
                id: Date.now() + 3,
                name: 'Transporte',
                subcategory: 'Gasolina',
                budget: 4000,
                recurringDate: new Date().toISOString().split('T')[0],
                frequency: 'biweekly',
                customDays: null,
                color: defaultColors['Transporte'],
                spent: 0
            },
            {
                id: Date.now() + 4,
                name: 'Salud y Bienestar',
                subcategory: 'Seguro médico',
                budget: 2500,
                recurringDate: new Date().toISOString().split('T')[0],
                frequency: 'monthly',
                customDays: null,
                color: defaultColors['Salud y Bienestar'],
                spent: 0
            },
            {
                id: Date.now() + 5,
                name: 'Educación',
                subcategory: 'Colegiatura',
                budget: 8000,
                recurringDate: new Date().toISOString().split('T')[0],
                frequency: 'monthly',
                customDays: null,
                color: defaultColors['Educación'],
                spent: 0
            },
            {
                id: Date.now() + 6,
                name: 'Servicios Financieros',
                subcategory: 'Cuenta de ahorros',
                budget: 6000,
                recurringDate: new Date().toISOString().split('T')[0],
                color: defaultColors['Servicios Financieros'],
                spent: 0
            }
        ];
        
        categories = defaultCategories;
        saveData();
        console.log('Categorías de presupuesto creadas:', categories.length);
    }
}

function loadData() {
    loadDataSafely();
    loadIncomes();
    
    // Inicializar fecha de inicio para ingresos
    const today = new Date().toISOString().split('T')[0];
    const incomeStartDate = document.getElementById('incomeStartDate');
    if (incomeStartDate) {
        incomeStartDate.value = today;
    }
}



function editCategory(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    // Llenar el formulario con los datos de la categoría
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categorySubcategory').value = category.subcategory || '';
    document.getElementById('categoryBudget').value = category.budget;
    document.getElementById('categoryRecurringDate').value = category.recurringDate || new Date().toISOString().split('T')[0];
    // Mantener el color de la categoría principal
    document.getElementById('categoryColor').value = getCategoryColor(category.name);
    
    // Llenar los campos de frecuencia
    const frequency = category.frequency || 'monthly';
    document.getElementById('categoryRecurringFrequency').value = frequency;
    
    // Mostrar/ocultar campo personalizado según la frecuencia
    const customGroup = document.getElementById('customFrequencyGroup');
    const customDaysInput = document.getElementById('categoryCustomDays');
    if (frequency === 'custom') {
        customGroup.style.display = 'block';
        customDaysInput.value = category.customDays || 30;
    } else {
        customGroup.style.display = 'none';
        customDaysInput.value = '';
    }
    
    // Actualizar dropdown de subcategorías
    updateSubcategoryDropdown();
    
    // Marcar el formulario como modo edición
    document.getElementById('categoryForm').dataset.editId = categoryId;
    
    // Cambiar el título del modal
    document.getElementById('categoryModalTitle').textContent = 'Editar Categoría';
    
    // Cambiar el texto del botón
    const submitBtn = document.querySelector('#categoryForm .btn-primary');
    submitBtn.textContent = 'Actualizar';
    
    openModal('categoryModal');
}

function deleteCategory(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    // Verificar si hay transacciones asociadas
    const hasTransactions = transactions.some(t => t.category === category.name);
    
    if (hasTransactions) {
        if (!confirm(`La categoría "${category.name}" tiene transacciones asociadas. ¿Estás seguro de que quieres eliminarla? Esto también eliminará todas las transacciones relacionadas.`)) {
            return;
        }
        // Eliminar transacciones asociadas
        transactions = transactions.filter(t => t.category !== category.name);
    } else {
        if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) {
            return;
        }
    }
    
    // Eliminar la categoría
    categories = categories.filter(cat => cat.id !== categoryId);
    
    saveData();
    updateUI();
}

function editTransaction(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    document.getElementById('transactionDescription').value = transaction.description;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionType').value = transaction.type;
    document.getElementById('transactionCategory').value = transaction.category;
    document.getElementById('transactionDate').value = transaction.date;
    document.getElementById('transactionComment').value = transaction.comment || '';
    transactionForm.dataset.editId = transactionId;
    document.getElementById('transactionModalTitle').textContent = transaction.type === 'gasto' ? 'Editar Gasto' : 'Editar Ingreso';
    const submitBtn = transactionForm.querySelector('.btn-primary');
    submitBtn.textContent = 'Actualizar';
    openModal('transactionModal');
}

function addSelectedCategoryToBudget() {
    const categoryName = document.getElementById('selectCategoryName').value;
    const subcategoryName = document.getElementById('selectSubcategoryName').value;
    const budget = parseFloat(document.getElementById('selectCategoryBudget').value);
    const recurringDate = document.getElementById('selectCategoryRecurringDate').value;
    const frequency = document.getElementById('selectCategoryRecurringFrequency').value;
    const customDays = frequency === 'custom' ? parseInt(document.getElementById('selectCategoryCustomDays').value) : null;
    const color = document.getElementById('selectCategoryColor').value;
    
    if (!categoryName || !budget || !recurringDate) {
        alert('Por favor completa todos los campos requeridos.');
        return;
    }
    
    // Verificar si ya existe esta categoría en el presupuesto
    const existingCategory = categories.find(cat => 
        cat.name === categoryName && cat.subcategory === subcategoryName
    );
    
    if (existingCategory) {
        alert('Esta categoría ya existe en tu presupuesto. Puedes editarla desde la lista de categorías.');
        return;
    }
    
    // Crear nueva categoría para el presupuesto
    const categoryData = {
        id: Date.now(),
        name: categoryName,
        subcategory: subcategoryName || null,
        budget: budget,
        recurringDate: recurringDate,
        frequency: frequency,
        customDays: customDays,
        color: getCategoryColor(categoryName),
        spent: 0
    };
    
    categories.push(categoryData);
    saveData();
    clearCaches(); // Limpiar caches cuando se actualicen datos
    updateUI();
    closeModal('selectCategoryModal');
}

function deleteTransaction(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar la transacción "${transaction.description}"?`)) {
        return;
    }
    
    // Restar el gasto de la categoría si es un gasto
    if (transaction.type === 'gasto') {
        const category = categories.find(cat => cat.name === transaction.category);
        if (category) {
            category.spent -= transaction.amount;
        }
    }
    
    // Eliminar la transacción
    transactions = transactions.filter(t => t.id !== transactionId);
    
    saveData();
    updateUI();
}

// Función global para cerrar modales (usada en HTML)
window.closeModal = closeModal;

// Optimizaciones implementadas:
// 1. Cache para formateo de moneda (currencyCache)
// 2. Cache para colores de categorías (colorCache)
// 3. Debouncing en updateUI() para evitar actualizaciones excesivas
// 4. Cache para transacciones filtradas (filteredTransactionsCache)
// 5. Manejo de errores mejorado en localStorage
// 6. Validación de datos al cargar
// 7. Delegación de eventos para mejor rendimiento
// 8. Fragmentos DOM para actualizaciones más eficientes



// Función para mostrar información del usuario
function showUserInfo() {
    if (currentUser) {
        const userData = users[currentUser];
        const totalCategories = userData.categories ? userData.categories.length : 0;
        const totalTransactions = userData.transactions ? userData.transactions.length : 0;
        
        console.log(`Usuario: ${currentUser}`);
        console.log(`Categorías: ${totalCategories}`);
        console.log(`Transacciones: ${totalTransactions}`);
    }
}

// Función para exportar datos del usuario
function exportUserData() {
    if (!currentUser) return;
    
    const userData = users[currentUser];
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `jm_budget_${currentUser}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Función para importar datos del usuario
function importUserData(file) {
    if (!currentUser) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validar estructura del backup
            const validation = validateBackupStructure(importedData);
            if (!validation.isValid) {
                alert('Error en el archivo de backup:\n\n' + validation.errors.join('\n'));
                return;
            }
            
            // Verificar si es un backup completo o datos simples
            let dataToImport;
            let isBackup = false;
            
            if (importedData.data && importedData.user && importedData.timestamp) {
                // Es un backup completo
                dataToImport = importedData.data;
                isBackup = true;
                
                // Verificar que el backup sea del usuario actual
                if (importedData.user !== currentUser) {
                    if (!confirm(`Este backup pertenece al usuario "${importedData.user}". ¿Quieres restaurarlo de todas formas?`)) {
                        return;
                    }
                }
            } else if (importedData.categories && importedData.transactions && importedData.categoryGroups) {
                // Son datos simples de importación
                dataToImport = importedData;
            } else if (importedData.categories || importedData.transactions || importedData.incomes) {
                // Datos parciales - intentar restaurar lo que esté disponible
                dataToImport = importedData;
                isBackup = true;
            } else {
                alert('El archivo JSON no contiene datos válidos de JM Budget.\n\nAsegúrate de que sea un backup creado por la aplicación.');
                return;
            }
            
            // Mostrar información del backup si es uno
            let confirmMessage = '¿Estás seguro de que quieres importar estos datos? Esto sobrescribirá tus datos actuales.';
            if (isBackup) {
                const backupDate = new Date(importedData.timestamp).toLocaleString('es-ES');
                const dataInfo = [];
                
                if (dataToImport.categories) dataInfo.push(`${dataToImport.categories.length} categorías`);
                if (dataToImport.transactions) dataInfo.push(`${dataToImport.transactions.length} transacciones`);
                if (dataToImport.incomes) dataInfo.push(`${dataToImport.incomes.length} ingresos`);
                
                confirmMessage = `Backup del ${backupDate}\nUsuario: ${importedData.user}\nDatos: ${dataInfo.join(', ')}\n\n¿Estás seguro de que quieres restaurar este backup? Esto sobrescribirá tus datos actuales.`;
            }
            
            // Confirmar importación
            if (confirm(confirmMessage)) {
                // Restaurar datos
                if (isBackup) {
                    // Restaurar desde backup completo
                    categories = dataToImport.categories || [];
                    transactions = dataToImport.transactions || [];
                    categoryGroups = dataToImport.categoryGroups || {};
                    incomes = dataToImport.incomes || [];
                    
                    // Actualizar datos del usuario
                    users[currentUser] = dataToImport.userData || {};
                    
                    // Guardar todo
                    saveData();
                    saveCategoryGroups();
                    saveIncomes();
                    saveUserData();
                } else {
                    // Importación simple
                    users[currentUser] = dataToImport;
                    loadUserData();
                    saveUserData();
                }
                
                clearCaches();
                updateUI(true);
                
                const successMessage = isBackup ? 'Backup restaurado exitosamente.' : 'Datos importados exitosamente.';
                alert(successMessage);
                
                // Agregar al historial
                const action = isBackup ? 'Backup restaurado' : 'Datos importados';
                const details = isBackup ? `Se restauró un backup del ${new Date(importedData.timestamp).toLocaleDateString('es-ES')}` : 'Se importaron datos externos';
                addToHistory(action, details, 'import');
            }
        } catch (error) {
            console.error('Error al importar datos:', error);
            alert('Error al importar datos:\n\n' + error.message + '\n\nAsegúrate de que el archivo sea un backup válido de JM Budget.');
        }
    };
    reader.readAsText(file);
}

// Función para cargar ingresos recurrentes
function loadIncomes() {
    try {
        // Los ingresos ya se cargan en loadUserData()
        // Esta función se mantiene por compatibilidad
        console.log('📥 Ingresos cargados:', incomes.length);
    } catch (error) {
        console.error('❌ Error al cargar ingresos recurrentes:', error);
        incomes = [];
    }
}

// Función para guardar ingresos recurrentes
function saveIncomes() {
    try {
        // Guardar en el sistema centralizado
        saveUserData();
        console.log('✅ Ingresos guardados exitosamente');
    } catch (error) {
        console.error('❌ Error al guardar ingresos recurrentes:', error);
        alert('Error al guardar los ingresos. Verifica el espacio disponible en tu navegador.');
    }
}

// Función para manejar el envío del formulario de ingresos recurrentes
function handleIncomeSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('incomeName').value.trim();
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const frequency = document.getElementById('incomeFrequency').value;
    const startDate = document.getElementById('incomeStartDate').value;
    const customDays = frequency === 'custom' ? parseInt(document.getElementById('incomeCustomDays').value) : null;
    const editId = incomeForm.dataset.editId;
    
    if (!name || !amount || !startDate) {
        alert('Por favor completa todos los campos requeridos.');
        return;
    }
    
    if (editId) {
        // Editar ingreso existente
        const incomeIndex = incomes.findIndex(inc => inc.id === parseInt(editId));
        if (incomeIndex !== -1) {
            incomes[incomeIndex] = {
                ...incomes[incomeIndex],
                name: name,
                amount: amount,
                frequency: frequency,
                startDate: startDate,
                customDays: customDays
            };
        }
        delete incomeForm.dataset.editId;
    } else {
        // Crear nuevo ingreso
        const incomeData = {
            id: Date.now(),
            name: name,
            amount: amount,
            frequency: frequency,
            startDate: startDate,
            customDays: customDays
        };
        incomes.push(incomeData);
    }
    
    saveIncomes();
    addToHistory('Ingreso recurrente', editId ? `Editó ingreso: ${name}` : `Agregó ingreso: ${name}`, 'income');
    clearCaches();
    updateUI();
    closeModal('incomeModal');
    
    // Mostrar confirmación
    showVisualNotification(
        editId ? 'Ingreso actualizado' : 'Ingreso agregado',
        `El ingreso "${name}" se ha ${editId ? 'actualizado' : 'agregado'} correctamente.`,
        'recurring'
    );
}

// Función para calcular el total de ingresos ajustados
function calculateTotalIncomes() {
    return incomes.reduce((sum, income) => {
        const adjustedAmount = calculateAdjustedBudget(income.amount, income.frequency, income.customDays);
        return sum + adjustedAmount;
    }, 0);
}

// Función para manejar cambios de frecuencia en el modal de ingresos
function handleIncomeFrequencyChange() {
    const frequency = document.getElementById('incomeFrequency').value;
    const customGroup = document.getElementById('incomeCustomFrequencyGroup');
    const customDaysInput = document.getElementById('incomeCustomDays');
    
    if (frequency === 'custom') {
        customGroup.style.display = 'block';
        customDaysInput.required = true;
    } else {
        customGroup.style.display = 'none';
        customDaysInput.required = false;
        customDaysInput.value = '';
    }
}

// Función para mostrar la lista de ingresos recurrentes
function updateIncomesDisplay() {
    const container = document.getElementById('incomesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (incomes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; margin: 20px 0;">No hay ingresos recurrentes configurados. Agrega un nuevo ingreso para comenzar.</p>';
        return;
    }
    
    // Crear contenedor para ingresos
    const incomesSection = document.createElement('div');
    incomesSection.style.marginBottom = '30px';
    
    // Título de la sección
    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = 'Ingresos Recurrentes';
    sectionTitle.style.marginBottom = '20px';
    sectionTitle.style.color = '#333';
    sectionTitle.style.fontSize = '18px';
    sectionTitle.style.fontWeight = '600';
    incomesSection.appendChild(sectionTitle);
    
    // Crear tarjetas para cada ingreso
    incomes.forEach(income => {
        const adjustedAmount = calculateAdjustedBudget(income.amount, income.frequency, income.customDays);
        const frequencyText = getFrequencyText(income.frequency, income.customDays);
        const nextIncome = income.startDate && income.frequency ? 
            getNextRecurrenceDate(income.startDate, income.frequency, income.customDays) : null;
        
        // Mostrar el monto base y el ajustado
        const amountDisplay = income.frequency && income.frequency !== 'monthly' ? 
            `${formatCurrency(income.amount)} → ${formatCurrency(adjustedAmount)}` : 
            formatCurrency(income.amount);
        
        const incomeCard = document.createElement('div');
        incomeCard.className = 'category-card income-card';
        incomeCard.style.display = 'flex';
        incomeCard.style.alignItems = 'center';
        incomeCard.style.justifyContent = 'space-between';
        incomeCard.style.gap = '18px';
        incomeCard.style.margin = '12px 0';
        incomeCard.style.padding = '18px 20px';
        incomeCard.style.background = '#fff';
        incomeCard.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
        incomeCard.style.border = '1px solid rgba(0,0,0,0.08)';
        incomeCard.style.borderLeft = '6px solid #34c759';
        
        incomeCard.innerHTML = `
            <div style="display: flex; align-items: center; gap: 16px; flex: 1;">
                <i class="fas fa-money-bill-wave" style="font-size: 28px; color: #34c759;"></i>
                <div>
                    <div style="font-weight: 600; color: #222; font-size: 16px; margin-bottom: 2px;">${income.name}</div>
                    <div style="color: #666; font-size: 14px; margin-bottom: 2px;">${amountDisplay}</div>
                    <div style="color: #8e8e93; font-size: 12px;">${frequencyText} - Próximo: ${formatDate(nextIncome || income.startDate)}</div>
                </div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <button class="btn-icon edit-income" data-id="${income.id}" title="Editar ingreso">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-income" data-id="${income.id}" title="Eliminar ingreso">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        incomesSection.appendChild(incomeCard);
    });
    
    container.appendChild(incomesSection);
    
    // Agregar event listeners para los botones
    document.querySelectorAll('.edit-income').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const incomeId = parseInt(e.currentTarget.dataset.id);
            editIncome(incomeId);
        });
    });
    
    document.querySelectorAll('.delete-income').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const incomeId = parseInt(e.currentTarget.dataset.id);
            deleteIncome(incomeId);
        });
    });
}

// Función para editar un ingreso
function editIncome(incomeId) {
    const income = incomes.find(inc => inc.id === incomeId);
    if (!income) return;
    
    // Llenar el formulario con los datos del ingreso
    document.getElementById('incomeName').value = income.name;
    document.getElementById('incomeAmount').value = income.amount;
    document.getElementById('incomeFrequency').value = income.frequency;
    document.getElementById('incomeStartDate').value = income.startDate;
    
    // Mostrar/ocultar campo personalizado según la frecuencia
    const customGroup = document.getElementById('incomeCustomFrequencyGroup');
    const customDaysInput = document.getElementById('incomeCustomDays');
    if (income.frequency === 'custom') {
        customGroup.style.display = 'block';
        customDaysInput.value = income.customDays || 30;
    } else {
        customGroup.style.display = 'none';
        customDaysInput.value = '';
    }
    
    // Marcar que estamos editando
    document.getElementById('incomeForm').dataset.editId = incomeId;
    document.getElementById('incomeModalTitle').textContent = 'Editar Ingreso Recurrente';
    
    openModal('incomeModal');
}

// Función para eliminar un ingreso
function deleteIncome(incomeId) {
    const income = incomes.find(inc => inc.id === incomeId);
    if (!income) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el ingreso "${income.name}"?`)) {
        return;
    }
    
    // Eliminar el ingreso
    incomes = incomes.filter(inc => inc.id !== incomeId);
    
    saveIncomes();
    clearCaches();
    updateUI();
}

// Función para crear backup de los datos del usuario
function createBackup() {
    if (!currentUser) {
        alert('Debes estar logueado para crear un backup.');
        return;
    }
    
    try {
        // Recopilar todos los datos del usuario
        const backupData = {
            user: currentUser,
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                categories: categories,
                transactions: transactions,
                categoryGroups: categoryGroups,
                incomes: incomes,
                userData: users[currentUser] || {}
            }
        };
        
        // Convertir a JSON
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Crear nombre de archivo con fecha y hora
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const fileName = `jm_budget_backup_${currentUser}_${dateStr}_${timeStr}.json`;
        
        // Crear enlace de descarga
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        
        // Simular clic para descargar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL
        URL.revokeObjectURL(url);
        
        // Mostrar mensaje de éxito
        alert(`Backup creado exitosamente: ${fileName}`);
        
        // Agregar al historial
        addToHistory('Backup creado', `Se creó un backup completo de los datos`, 'backup');
        
    } catch (error) {
        console.error('Error al crear backup:', error);
        alert('Error al crear el backup: ' + error.message);
    }
}

// Funciones para reportes avanzados
function updateAdvancedReports() {
    updateTrendAnalysis();
    updateTopCategories();
    updateMonthComparison();
    updateDetailedCategoryChart();
}

function updateTrendAnalysis() {
    const selectedMonth = document.getElementById('reportMonth').value;
    const months = getAvailableMonths();
    
    if (months.length < 2) {
        document.getElementById('monthlyTrend').textContent = 'N/A';
        return;
    }
    
    // Calcular tendencia de los últimos 3 meses
    const recentMonths = months.slice(-3);
    const monthlyData = recentMonths.map(month => {
        const monthTransactions = transactions.filter(t => t.date.startsWith(month));
        const expenses = monthTransactions
            .filter(t => t.type === 'gasto')
            .reduce((sum, t) => sum + t.amount, 0);
        return { month, expenses };
    });
    
    // Calcular tendencia
    if (monthlyData.length >= 2) {
        const current = monthlyData[monthlyData.length - 1].expenses;
        const previous = monthlyData[monthlyData.length - 2].expenses;
        const change = current - previous;
        const percentage = previous > 0 ? (change / previous) * 100 : 0;
        
        const trendText = `${change >= 0 ? '+' : ''}${formatCurrency(change)} (${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%)`;
        document.getElementById('monthlyTrend').textContent = trendText;
        document.getElementById('monthlyTrend').className = `amount ${change >= 0 ? 'expense' : 'income'}`;
    }
    
    // Actualizar gráfico de tendencias
    updateTrendChart(monthlyData);
}

function updateTrendChart(monthlyData) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    if (window.trendChart && typeof window.trendChart.destroy === 'function') {
        window.trendChart.destroy();
    }
    
    const labels = monthlyData.map(d => new Date(d.month + '-01').toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short' 
    }));
    
    const data = monthlyData.map(d => d.expenses);
    
    window.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos Mensuales',
                data: data,
                borderColor: '#ff3b30',
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function updateTopCategories() {
    const selectedMonth = document.getElementById('reportMonth').value;
    const monthTransactions = selectedMonth 
        ? transactions.filter(t => t.date.startsWith(selectedMonth))
        : transactions;
    
    // Agrupar gastos por categoría
    const categoryTotals = {};
    monthTransactions
        .filter(t => t.type === 'gasto')
        .forEach(t => {
            const category = t.category;
            if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
            }
            categoryTotals[category] += t.amount;
        });
    
    // Ordenar por total y tomar top 5
    const topCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    // Generar HTML
    const container = document.getElementById('topCategoriesList');
    if (!container) return;
    
    if (topCategories.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; font-style: italic;">No hay datos de gastos para mostrar</p>';
        return;
    }
    
    container.innerHTML = topCategories.map(([category, amount]) => {
        const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
        const color = getCategoryColor(category);
        
        return `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-color" style="background-color: ${color}"></div>
                    <div class="category-name">${category}</div>
                </div>
                <div style="text-align: right;">
                    <div class="category-amount">${formatCurrency(amount)}</div>
                    <div class="category-percentage">${percentage.toFixed(1)}% del total</div>
                </div>
            </div>
        `;
    }).join('');
}

function updateMonthComparison() {
    const selectedMonth = document.getElementById('reportMonth').value;
    if (!selectedMonth) {
        document.getElementById('monthComparison').innerHTML = '<p style="color: #666; text-align: center; font-style: italic;">Selecciona un mes para comparar</p>';
        return;
    }
    
    // Obtener mes anterior
    const currentDate = new Date(selectedMonth + '-01');
    const previousDate = new Date(currentDate);
    previousDate.setMonth(previousDate.getMonth() - 1);
    const previousMonth = previousDate.toISOString().slice(0, 7);
    
    // Calcular datos para ambos meses
    const currentData = calculateMonthData(selectedMonth);
    const previousData = calculateMonthData(previousMonth);
    
    // Generar comparaciones
    const comparisons = [
        { label: 'Gastos', current: currentData.expenses, previous: previousData.expenses },
        { label: 'Ingresos', current: currentData.income, previous: previousData.income },
        { label: 'Balance', current: currentData.balance, previous: previousData.balance }
    ];
    
    const container = document.getElementById('monthComparison');
    container.innerHTML = comparisons.map(comp => {
        const change = comp.current - comp.previous;
        const percentage = comp.previous > 0 ? (change / comp.previous) * 100 : 0;
        
        let changeClass = 'neutral';
        let changeIcon = '';
        if (change > 0) {
            changeClass = comp.label === 'Gastos' ? 'negative' : 'positive';
            changeIcon = '↗';
        } else if (change < 0) {
            changeClass = comp.label === 'Gastos' ? 'positive' : 'negative';
            changeIcon = '↘';
        }
        
        return `
            <div class="comparison-item">
                <div class="comparison-label">${comp.label}</div>
                <div class="comparison-values">
                    <div class="comparison-current">${formatCurrency(comp.current)}</div>
                    <div class="comparison-previous">vs ${formatCurrency(comp.previous)}</div>
                    <div class="comparison-change ${changeClass}">
                        ${changeIcon} ${change >= 0 ? '+' : ''}${percentage.toFixed(1)}%
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function calculateMonthData(month) {
    const monthTransactions = transactions.filter(t => t.date.startsWith(month));
    const income = monthTransactions
        .filter(t => t.type === 'ingreso')
        .reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions
        .filter(t => t.type === 'gasto')
        .reduce((sum, t) => sum + t.amount, 0);
    
    return {
        income,
        expenses,
        balance: income - expenses
    };
}

function updateDetailedCategoryChart() {
    const selectedMonth = document.getElementById('reportMonth').value;
    const monthTransactions = selectedMonth 
        ? transactions.filter(t => t.date.startsWith(selectedMonth))
        : transactions;
    
    // Agrupar por categoría y subcategoría
    const categoryData = {};
    monthTransactions
        .filter(t => t.type === 'gasto')
        .forEach(t => {
            const category = t.category;
            const subcategory = t.subcategory;
            const key = `${category} - ${subcategory}`;
            
            if (!categoryData[key]) {
                categoryData[key] = {
                    amount: 0,
                    category: category,
                    subcategory: subcategory,
                    color: getCategoryColor(category)
                };
            }
            categoryData[key].amount += t.amount;
        });
    
    // Ordenar por cantidad
    const sortedData = Object.values(categoryData)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10); // Top 10
    
    const ctx = document.getElementById('detailedCategoryChart');
    if (!ctx) return;
    
    if (window.detailedCategoryChart && typeof window.detailedCategoryChart.destroy === 'function') {
        window.detailedCategoryChart.destroy();
    }
    
    window.detailedCategoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(d => d.subcategory),
            datasets: [{
                label: 'Gastos por Subcategoría',
                data: sortedData.map(d => d.amount),
                backgroundColor: sortedData.map(d => d.color),
                borderColor: sortedData.map(d => d.color),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function exportReport() {
    const selectedMonth = document.getElementById('reportMonth').value;
    const reportType = document.getElementById('reportType').value;
    
    // Generar datos del reporte
    const reportData = generateReportData(selectedMonth, reportType);
    
    // Crear archivo CSV
    const csvContent = generateCSV(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Descargar archivo
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${selectedMonth || 'todos'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateReportData(selectedMonth, reportType) {
    const monthTransactions = selectedMonth 
        ? transactions.filter(t => t.date.startsWith(selectedMonth))
        : transactions;
    
    switch (reportType) {
        case 'trends':
            return generateTrendsData(monthTransactions);
        case 'categories':
            return generateCategoriesData(monthTransactions);
        case 'comparison':
            return generateComparisonData(selectedMonth);
        default:
            return generateOverviewData(monthTransactions);
    }
}

function generateOverviewData(transactions) {
    const income = transactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + t.amount, 0);
    
    return [
        ['Concepto', 'Monto'],
        ['Ingresos', formatCurrency(income)],
        ['Gastos', formatCurrency(expenses)],
        ['Balance', formatCurrency(income - expenses)]
    ];
}

function generateTrendsData(transactions) {
    // Agrupar por mes
    const monthlyData = {};
    transactions.forEach(t => {
        const month = t.date.substring(0, 7);
        if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expenses: 0 };
        }
        if (t.type === 'ingreso') {
            monthlyData[month].income += t.amount;
        } else {
            monthlyData[month].expenses += t.amount;
        }
    });
    
    const data = [['Mes', 'Ingresos', 'Gastos', 'Balance']];
    Object.entries(monthlyData).forEach(([month, data]) => {
        data.push([
            new Date(month + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' }),
            formatCurrency(data.income),
            formatCurrency(data.expenses),
            formatCurrency(data.income - data.expenses)
        ]);
    });
    
    return data;
}

function generateCategoriesData(transactions) {
    const categoryTotals = {};
    transactions.filter(t => t.type === 'gasto').forEach(t => {
        const key = `${t.category} - ${t.subcategory}`;
        categoryTotals[key] = (categoryTotals[key] || 0) + t.amount;
    });
    
    const data = [['Categoría', 'Subcategoría', 'Monto']];
    Object.entries(categoryTotals).forEach(([key, amount]) => {
        const [category, subcategory] = key.split(' - ');
        data.push([category, subcategory, formatCurrency(amount)]);
    });
    
    return data;
}

function generateComparisonData(selectedMonth) {
    if (!selectedMonth) return [['Error', 'Selecciona un mes para comparar']];
    
    const currentData = calculateMonthData(selectedMonth);
    const previousDate = new Date(selectedMonth + '-01');
    previousDate.setMonth(previousDate.getMonth() - 1);
    const previousMonth = previousDate.toISOString().slice(0, 7);
    const previousData = calculateMonthData(previousMonth);
    
    return [
        ['Concepto', 'Mes Actual', 'Mes Anterior', 'Diferencia', 'Cambio %'],
        ['Ingresos', formatCurrency(currentData.income), formatCurrency(previousData.income), 
         formatCurrency(currentData.income - previousData.income),
         `${((currentData.income - previousData.income) / previousData.income * 100).toFixed(1)}%`],
        ['Gastos', formatCurrency(currentData.expenses), formatCurrency(previousData.expenses),
         formatCurrency(currentData.expenses - previousData.expenses),
         `${((currentData.expenses - previousData.expenses) / previousData.expenses * 100).toFixed(1)}%`],
        ['Balance', formatCurrency(currentData.balance), formatCurrency(previousData.balance),
         formatCurrency(currentData.balance - previousData.balance),
         `${((currentData.balance - previousData.balance) / previousData.balance * 100).toFixed(1)}%`]
    ];
}

function generateCSV(data) {
    return data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Sistema de notificaciones y recordatorios
let notifications = [];
let recurringReminders = [];

function initializeNotifications() {
    try {
        console.log('Inicializando sistema de notificaciones...');
        loadNotifications();
        
        // Limpiar notificaciones antiguas al inicializar
        clearOldNotifications();
        
        setupNotificationEventListeners();
        checkForNotifications();
        setupRecurringReminders();
        console.log('Sistema de notificaciones inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar notificaciones:', error);
    }
}

function loadNotifications() {
    try {
        const savedNotifications = localStorage.getItem(`notifications_${currentUser}`);
        notifications = savedNotifications ? JSON.parse(savedNotifications) : [];
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        notifications = [];
    }
}

function saveNotifications() {
    try {
        localStorage.setItem(`notifications_${currentUser}`, JSON.stringify(notifications));
    } catch (error) {
        console.error('Error al guardar notificaciones:', error);
    }
}

function addNotification(title, message, type = 'general', priority = 'normal') {
    // Verificar si ya existe una notificación similar no leída
    const existingNotification = notifications.find(n => 
        n.title === title && 
        n.type === type && 
        !n.read &&
        new Date().getTime() - new Date(n.timestamp).getTime() < 24 * 60 * 60 * 1000 // 24 horas
    );
    
    if (existingNotification) {
        console.log('Notificación similar ya existe, no se agrega duplicado:', title);
        return;
    }
    
    const notification = {
        id: Date.now() + Math.random(),
        title: title,
        message: message,
        type: type,
        priority: priority,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    
    // Mantener solo las últimas 30 notificaciones y limpiar las muy antiguas
    if (notifications.length > 30) {
        notifications = notifications.slice(0, 30);
    }
    
    // Limpiar notificaciones muy antiguas (más de 7 días)
    const weekAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
    notifications = notifications.filter(n => new Date(n.timestamp).getTime() > weekAgo);
    
    saveNotifications();
    updateNotificationsDisplay();
    
    // Mostrar notificación visual si es de alta prioridad
    if (priority === 'high') {
        showVisualNotification(title, message, type);
    }
}

function showVisualNotification(title, message, type) {
    // Crear notificación visual temporal
    const notification = document.createElement('div');
    notification.className = `visual-notification ${type}`;
    notification.innerHTML = `
        <div class="visual-notification-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

function updateNotificationsDisplay() {
    try {
        const container = document.getElementById('notificationsList');
        const countElement = document.getElementById('notificationsCount');
        
        if (!container || !countElement) {
            console.log('Elementos de notificaciones no encontrados');
            return;
        }
    
    const unreadCount = notifications.filter(n => !n.read).length;
    countElement.textContent = unreadCount;
    
    if (unreadCount > 0) {
        countElement.style.display = 'flex';
    } else {
        countElement.style.display = 'none';
    }
    
    if (notifications.length === 0) {
        container.innerHTML = '<div class="no-notifications">No hay notificaciones</div>';
        return;
    }
    
    // Agregar botón para marcar todas como leídas si hay notificaciones no leídas
    let headerHtml = '';
    if (unreadCount > 0) {
        headerHtml = `
            <div class="notifications-header">
                <span>${unreadCount} no leída${unreadCount > 1 ? 's' : ''}</span>
                <button class="btn-mark-all-read" onclick="markAllNotificationsAsRead()">
                    <i class="fas fa-check-double"></i> Marcar todas como leídas
                </button>
            </div>
        `;
    }
    
    container.innerHTML = headerHtml + notifications.map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
            <div class="notification-header">
                <h4 class="notification-title">${notification.title}</h4>
                <div class="notification-actions">
                    <span class="notification-time">${getTimeAgo(notification.timestamp)}</span>
                    <button class="btn-delete-notification" onclick="deleteNotification('${notification.id}')" title="Eliminar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <p class="notification-message">${notification.message}</p>
            <div class="notification-footer">
                <span class="notification-type ${notification.type}">${getNotificationTypeText(notification.type)}</span>
                ${!notification.read ? '<span class="unread-indicator"><i class="fas fa-circle"></i></span>' : ''}
            </div>
        </div>
    `).join('');
    
    // Agregar event listeners para marcar como leídas
    container.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const notificationId = item.dataset.id;
            console.log('Clic en notificación, ID:', notificationId);
            markNotificationAsRead(notificationId);
        });
    });
    } catch (error) {
        console.error('Error al actualizar notificaciones:', error);
    }
}

function markNotificationAsRead(notificationId) {
    console.log('Marcando notificación como leída:', notificationId, 'Tipo:', typeof notificationId);
    console.log('Notificaciones disponibles:', notifications.map(n => ({ id: n.id, title: n.title, read: n.read })));
    
    // Convertir a número si es string
    const id = typeof notificationId === 'string' ? parseFloat(notificationId) : notificationId;
    
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        console.log('Notificación encontrada, marcando como leída:', notification.title);
        notification.read = true;
        saveNotifications();
        updateNotificationsDisplay();
    } else {
        console.log('No se encontró la notificación con ID:', id);
    }
}

function getNotificationTypeText(type) {
    const types = {
        'budget': 'Presupuesto',
        'recurring': 'Recurrente',
        'reminder': 'Recordatorio',
        'warning': 'Advertencia',
        'general': 'General'
    };
    return types[type] || 'General';
}

function setupNotificationEventListeners() {
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsList = document.getElementById('notificationsList');
    
    if (notificationsBtn && notificationsList) {
        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsList.classList.toggle('show');
        });
        
        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!notificationsBtn.contains(e.target) && !notificationsList.contains(e.target)) {
                notificationsList.classList.remove('show');
            }
        });
    }
}

function checkForNotifications() {
    try {
        checkBudgetAlerts();
        checkRecurringExpenses();
        checkUpcomingReminders();
        
        // Verificar cada 5 minutos
        setTimeout(checkForNotifications, 5 * 60 * 1000);
    } catch (error) {
        console.error('Error al verificar notificaciones:', error);
    }
}

function checkBudgetAlerts() {
    const totalBudget = categories.reduce((sum, cat) => sum + cat.adjustedBudget, 0);
    const totalSpent = transactions
        .filter(t => t.type === 'gasto')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    // Alerta al 80% del presupuesto
    if (percentage >= 80 && percentage < 100) {
        const existingAlert = notifications.find(n => 
            n.type === 'budget' && 
            n.title.includes('80%') && 
            !n.read
        );
        
        if (!existingAlert) {
            addNotification(
                'Alerta de Presupuesto - 80%',
                `Has gastado el ${percentage.toFixed(1)}% de tu presupuesto mensual. Considera revisar tus gastos.`,
                'budget',
                'high'
            );
        }
    }
    
    // Alerta crítica al 100% o más
    if (percentage >= 100) {
        const existingAlert = notifications.find(n => 
            n.type === 'budget' && 
            n.title.includes('100%') && 
            !n.read
        );
        
        if (!existingAlert) {
            addNotification(
                'Alerta Crítica - Presupuesto Excedido',
                `Has excedido tu presupuesto mensual en ${formatCurrency(totalSpent - totalBudget)}.`,
                'warning',
                'high'
            );
        }
    }
}

function checkRecurringExpenses() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    categories.forEach(category => {
        if (category.recurringDate) {
            const recurringDate = new Date(category.recurringDate);
            const nextRecurrence = getNextRecurrenceDate(
                category.recurringDate,
                category.frequency,
                category.customDays
            );
            
            if (nextRecurrence) {
                const daysUntil = Math.ceil((new Date(nextRecurrence) - today) / (1000 * 60 * 60 * 24));
                
                // Recordatorio 3 días antes
                if (daysUntil === 3) {
                    addNotification(
                        'Gasto Recurrente Próximo',
                        `El gasto "${category.name}" de ${formatCurrency(category.adjustedBudget)} vence en 3 días.`,
                        'recurring',
                        'normal'
                    );
                }
                
                // Recordatorio el día anterior
                if (daysUntil === 1) {
                    addNotification(
                        'Gasto Recurrente Mañana',
                        `Recuerda pagar "${category.name}" mañana.`,
                        'recurring',
                        'high'
                    );
                }
            }
        }
    });
}

function checkUpcomingReminders() {
    // Verificar ingresos recurrentes
    incomes.forEach(income => {
        const nextIncome = getNextRecurrenceDate(
            income.startDate,
            income.frequency,
            income.customDays
        );
        
        if (nextIncome) {
            const daysUntil = Math.ceil((new Date(nextIncome) - new Date()) / (1000 * 60 * 60 * 24));
            
            // Recordatorio 2 días antes del ingreso
            if (daysUntil === 2) {
                addNotification(
                    'Ingreso Recurrente Próximo',
                    `Tu ingreso "${income.name}" de ${formatCurrency(income.amount)} está programado para dentro de 2 días.`,
                    'reminder',
                    'normal'
                );
            }
        }
    });
}

function setupRecurringReminders() {
    // Configurar recordatorios automáticos
    setInterval(() => {
        checkForNotifications();
    }, 60 * 60 * 1000); // Verificar cada hora
}

// Función para limpiar notificaciones antiguas
function clearOldNotifications() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const originalCount = notifications.length;
    notifications = notifications.filter(notification => {
        const notificationDate = new Date(notification.timestamp);
        return notificationDate > sevenDaysAgo;
    });
    
    if (originalCount !== notifications.length) {
        console.log(`Limpiadas ${originalCount - notifications.length} notificaciones antiguas`);
        saveNotifications();
        updateNotificationsDisplay();
    }
}

// Función para eliminar una notificación específica
function deleteNotification(notificationId) {
    const id = typeof notificationId === 'string' ? parseFloat(notificationId) : notificationId;
    const originalCount = notifications.length;
    
    notifications = notifications.filter(n => n.id !== id);
    
    if (notifications.length !== originalCount) {
        console.log('Notificación eliminada:', notificationId);
        saveNotifications();
        updateNotificationsDisplay();
    }
}

// Función para limpiar todas las notificaciones
function clearAllNotifications() {
    if (notifications.length > 0) {
        console.log('Limpiando todas las notificaciones');
        notifications = [];
        saveNotifications();
        updateNotificationsDisplay();
    }
}

// Función para marcar todas las notificaciones como leídas
function markAllNotificationsAsRead() {
    let hasChanges = false;
    notifications.forEach(notification => {
        if (!notification.read) {
            notification.read = true;
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        console.log('Marcando todas las notificaciones como leídas');
        saveNotifications();
        updateNotificationsDisplay();
    }
}

function getAvailableMonths() {
    // Obtener todos los meses únicos de las transacciones
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))];
    
    // Ordenar cronológicamente
    months.sort();
    
    return months;
}

// Función para validar estructura de backup JSON
function validateBackupStructure(data) {
    const errors = [];
    
    // Verificar estructura básica
    if (!data || typeof data !== 'object') {
        errors.push('El archivo no es un JSON válido');
        return { isValid: false, errors };
    }
    
    // Verificar si es un backup completo
    if (data.data && data.user && data.timestamp) {
        // Es un backup completo
        if (!data.data.categories && !data.data.transactions && !data.data.incomes) {
            errors.push('El backup no contiene datos válidos (categorías, transacciones o ingresos)');
        }
    } else if (data.categories || data.transactions || data.incomes) {
        // Son datos directos
        if (!data.categories && !data.transactions && !data.incomes) {
            errors.push('El archivo no contiene datos válidos de JM Budget');
        }
    } else {
        errors.push('El archivo no tiene la estructura esperada de un backup de JM Budget');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Funciones para el modo oscuro
function initializeTheme() {
    // Cargar tema guardado o usar preferencia del sistema
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (systemPrefersDark) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
    
    // Configurar event listener para el botón de tema
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Escuchar cambios en la preferencia del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Actualizar icono del botón
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        const icon = themeToggleBtn.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    // Actualizar título del botón
    if (themeToggleBtn) {
        themeToggleBtn.title = theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Agregar al historial
    addToHistory('Tema cambiado', `Cambió a modo ${newTheme === 'dark' ? 'oscuro' : 'claro'}`, 'theme');
}

// Función para detectar si la app está instalada como PWA
function checkPWAInstallation() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = window.navigator.standalone || isStandalone;
    
    if (isInstalled) {
        // Ocultar botón de instalación si ya está instalada
        const installBtn = document.getElementById('installAppBtn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
        
        // Agregar clase para estilos específicos de PWA
        document.body.classList.add('pwa-installed');
    }
    
    // Verificar si el navegador soporta PWA
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('✅ PWA soportado');
        
        // Mostrar botón de instalación si no está instalada
        const installBtn = document.getElementById('installAppBtn');
        if (installBtn && !isInstalled) {
            // Verificar si ya se puede instalar
            if (window.deferredPrompt) {
                installBtn.style.display = 'block';
            }
        }
    } else {
        console.log('❌ PWA no soportado');
        const installBtn = document.getElementById('installAppBtn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }
}

// Función de guardado automático periódico
function setupAutoSave() {
    // Guardar automáticamente cada 30 segundos si hay cambios
    setInterval(() => {
        if (currentUser && (categories.length > 0 || transactions.length > 0 || incomes.length > 0)) {
            try {
                saveUserData();
                console.log('💾 Guardado automático realizado');
            } catch (error) {
                console.error('❌ Error en guardado automático:', error);
            }
        }
    }, 30000); // 30 segundos
    
    // Guardar antes de que el usuario salga de la página
    window.addEventListener('beforeunload', () => {
        if (currentUser) {
            try {
                saveUserData();
                console.log('💾 Guardado antes de salir');
            } catch (error) {
                console.error('❌ Error al guardar antes de salir:', error);
            }
        }
    });
    
    // Guardar cuando la página pierde el foco
    window.addEventListener('blur', () => {
        if (currentUser) {
            try {
                saveUserData();
                console.log('💾 Guardado al perder foco');
            } catch (error) {
                console.error('❌ Error al guardar al perder foco:', error);
            }
        }
    });
}

// --- SUBTABS TRANSACCIONES ---
document.addEventListener('DOMContentLoaded', function() {
    const subtabBtns = document.querySelectorAll('.subtab-btn');
    const gastosContainer = document.getElementById('gastosContainer');
    const ingresosContainer = document.getElementById('ingresosContainer');
    const addGastoBtn = document.getElementById('addGastoBtn');
    const addIngresoBtn = document.getElementById('addIngresoBtn');

    subtabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            subtabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.subtab === 'gastos') {
                gastosContainer.classList.add('active');
                ingresosContainer.classList.remove('active');
                addGastoBtn.style.display = '';
                addIngresoBtn.style.display = 'none';
            } else {
                gastosContainer.classList.remove('active');
                ingresosContainer.classList.add('active');
                addGastoBtn.style.display = 'none';
                addIngresoBtn.style.display = '';
            }
        });
    });

    // Mostrar por defecto el botón de gasto
    addGastoBtn.style.display = '';
    addIngresoBtn.style.display = 'none';

    // Lógica para crear nueva transacción según tipo
    addGastoBtn.addEventListener('click', function() {
        openTransactionModal('gasto');
    });
    addIngresoBtn.addEventListener('click', function() {
        openTransactionModal('ingreso');
    });
});

function openTransactionModal(tipo) {
    document.getElementById('transactionType').value = tipo;
    document.getElementById('transactionModalTitle').textContent = tipo === 'gasto' ? 'Nuevo Gasto' : 'Nuevo Ingreso';
    const submitBtn = document.getElementById('transactionForm').querySelector('.btn-primary');
    submitBtn.textContent = 'Guardar';
    document.getElementById('transactionForm').reset();
    delete document.getElementById('transactionForm').dataset.editId;
    
    // Establecer fecha actual
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    
    // Actualizar categorías según el tipo
    updateCategorySelect();
    
    openModal('transactionModal');
}

// Función de depuración para verificar transacciones
function debugTransactions() {
    console.log('=== DEBUG TRANSACCIONES ===');
    console.log('Transacciones totales:', transactions.length);
    console.log('Transacciones:', transactions);
    
    const gastos = transactions.filter(t => t.type === 'gasto');
    const ingresos = transactions.filter(t => t.type === 'ingreso');
    
    console.log('Gastos:', gastos.length, gastos);
    console.log('Ingresos:', ingresos.length, ingresos);
    
    console.log('Categorías disponibles:', Object.keys(categoryGroups));
    console.log('Categorías de ingresos:', Object.keys(defaultIncomeCategories));
    console.log('=== FIN DEBUG ===');
}

// Función para limpiar y reinicializar datos (solo para desarrollo)
function resetTransactionData() {
    if (confirm('¿Estás seguro de que quieres limpiar todas las transacciones? Esto no se puede deshacer.')) {
        transactions = [];
        saveData();
        updateUI(true);
        console.log('Datos de transacciones limpiados');
    }
}

// Funciones para configuración de servicios en la nube
function setupCloudSyncTabs() {
    const tabBtns = document.querySelectorAll('.cloud-tab-btn');
    const tabContents = document.querySelectorAll('.cloud-tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Remover clase active de todos los botones y contenidos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Agregar clase active al botón y contenido seleccionado
            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

function updateSyncStatus() {
    const syncStatus = document.getElementById('syncStatus');
    const currentService = window.cloudServices ? window.cloudServices.getCurrentService() : null;
    
    if (currentService) {
        syncStatus.innerHTML = `
            <p class="sync-status-success">
                <i class="fas fa-check-circle"></i> 
                Conectado a ${currentService.charAt(0).toUpperCase() + currentService.slice(1)}
            </p>
        `;
    } else {
        syncStatus.innerHTML = `
            <p class="sync-status-info">
                <i class="fas fa-info-circle"></i> 
                No hay servicio configurado
            </p>
        `;
    }
}

// Funciones de configuración de servicios
function configureFirebase() {
    const config = {
        apiKey: document.getElementById('firebaseApiKey').value,
        authDomain: document.getElementById('firebaseAuthDomain').value,
        projectId: document.getElementById('firebaseProjectId').value,
        storageBucket: document.getElementById('firebaseStorageBucket').value,
        messagingSenderId: document.getElementById('firebaseMessagingSenderId').value,
        appId: document.getElementById('firebaseAppId').value
    };
    
    if (Object.values(config).some(value => !value)) {
        alert('Por favor, completa todos los campos de configuración de Firebase.');
        return;
    }
    
    if (window.cloudServices) {
        window.cloudServices.configureFirebase(config);
        updateSyncStatus();
        alert('✅ Firebase configurado exitosamente para todos los usuarios.\n\nEsta configuración se aplicará automáticamente a todos los usuarios que usen esta aplicación.');
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

// Función para configurar Firebase directamente desde la consola
window.setupFirebase = function(apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) {
    const config = {
        apiKey: apiKey,
        authDomain: authDomain,
        projectId: projectId,
        storageBucket: storageBucket,
        messagingSenderId: messagingSenderId,
        appId: appId
    };
    
    if (window.cloudServices) {
        window.cloudServices.configureFirebase(config);
        console.log('✅ Firebase configurado globalmente:', config);
        return true;
    } else {
        console.error('❌ Servicios en la nube no disponibles');
        return false;
    }
};

function configureSupabase() {
    const url = document.getElementById('supabaseUrl').value;
    const anonKey = document.getElementById('supabaseAnonKey').value;
    
    if (!url || !anonKey) {
        alert('Por favor, completa todos los campos de configuración de Supabase.');
        return;
    }
    
    if (window.cloudServices) {
        window.cloudServices.configureSupabase(url, anonKey);
        updateSyncStatus();
        alert('Supabase configurado exitosamente.');
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

function configureDropbox() {
    const accessToken = document.getElementById('dropboxAccessToken').value;
    
    if (!accessToken) {
        alert('Por favor, ingresa el access token de Dropbox.');
        return;
    }
    
    if (window.cloudServices) {
        window.cloudServices.configureDropbox(accessToken);
        updateSyncStatus();
        alert('Dropbox configurado exitosamente.');
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

function configureGoogleDrive() {
    const accessToken = document.getElementById('googleDriveAccessToken').value;
    
    if (!accessToken) {
        alert('Por favor, ingresa el access token de Google Drive.');
        return;
    }
    
    if (window.cloudServices) {
        window.cloudServices.configureGoogleDrive(accessToken);
        updateSyncStatus();
        alert('Google Drive configurado exitosamente.');
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

// Funciones de prueba de conexión
async function testFirebaseConnection() {
    if (window.cloudServices) {
        const result = await window.cloudServices.testConnection();
        if (result.success) {
            alert('✅ Conexión exitosa con Firebase');
        } else {
            alert(`❌ Error de conexión: ${result.message}`);
        }
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

async function testSupabaseConnection() {
    if (window.cloudServices) {
        const result = await window.cloudServices.testConnection();
        if (result.success) {
            alert('✅ Conexión exitosa con Supabase');
        } else {
            alert(`❌ Error de conexión: ${result.message}`);
        }
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

async function testDropboxConnection() {
    if (window.cloudServices) {
        const result = await window.cloudServices.testConnection();
        if (result.success) {
            alert('✅ Conexión exitosa con Dropbox');
        } else {
            alert(`❌ Error de conexión: ${result.message}`);
        }
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

async function testGoogleDriveConnection() {
    if (window.cloudServices) {
        const result = await window.cloudServices.testConnection();
        if (result.success) {
            alert('✅ Conexión exitosa con Google Drive');
        } else {
            alert(`❌ Error de conexión: ${result.message}`);
        }
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

// Funciones de sincronización
async function syncNow() {
    if (!currentUser) {
        alert('Debes estar logueado para sincronizar datos.');
        return;
    }
    
    if (!window.cloudServices || !window.cloudServices.getCurrentService()) {
        alert('No hay servicio en la nube configurado.');
        return;
    }
    
    try {
        // Preparar datos para sincronización
        const userData = {
            categories: categories,
            transactions: transactions,
            categoryGroups: categoryGroups,
            incomes: incomes,
            notifications: notifications,
            lastSync: new Date().toISOString()
        };
        
        // Sincronizar con la nube
        const result = await window.cloudServices.syncToCloud(userData, currentUser);
        
        if (result) {
            alert('✅ Datos sincronizados exitosamente con la nube.');
            updateSyncStatus();
        } else {
            alert('❌ Error al sincronizar datos con la nube.');
        }
    } catch (error) {
        console.error('Error en sincronización:', error);
        alert(`❌ Error de sincronización: ${error.message}`);
    }
}

function viewSyncHistory() {
    // Implementar vista de historial de sincronización
    alert('Función de historial de sincronización en desarrollo.');
}

// Integración con el sistema de almacenamiento profesional
async function saveDataWithProfessionalStorage() {
    if (window.professionalStorage && currentUser) {
        const userData = {
            categories: categories,
            transactions: transactions,
            categoryGroups: categoryGroups,
            incomes: incomes,
            notifications: notifications
        };
        
        // Guardar usando el sistema profesional
        await window.professionalStorage.saveUserData(currentUser, userData);
        
        // Sincronizar con la nube si está disponible
        if (window.cloudServices && window.cloudServices.getCurrentService()) {
            await window.cloudServices.syncToCloud(userData, currentUser);
        }
    }
}

async function loadDataWithProfessionalStorage() {
    if (window.professionalStorage && currentUser) {
        const userData = await window.professionalStorage.loadUserData(currentUser);
        
        if (userData) {
            categories = userData.categories || [];
            transactions = userData.transactions || [];
            categoryGroups = userData.categoryGroups || {};
            incomes = userData.incomes || [];
            notifications = userData.notifications || [];
            
            console.log('✅ Datos cargados usando sistema profesional de almacenamiento');
            return true;
        }
    }
    return false;
}

// ===== FUNCIONES MEJORADAS DE SINCRONIZACIÓN =====

// Función para mostrar pestañas
function showTab(tabName) {
    // Ocultar todas las pestañas
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Desactivar todos los botones
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar la pestaña seleccionada
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Activar el botón correspondiente
    const selectedButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Cargar contenido específico de la pestaña
    switch(tabName) {
        case 'sync':
            updateSyncStatus();
            break;
        case 'history':
            loadSyncHistory();
            break;
    }
}

// ===== MEJORAS MOBILE AVANZADAS =====

// Detectar si es dispositivo móvil
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

// Mejorar navegación táctil
function setupMobileNavigation() {
    if (!isMobileDevice()) return;
    
    // Mejorar scroll horizontal en pestañas
    const tabNavigation = document.querySelector('.tab-navigation');
    if (tabNavigation) {
        let isScrolling = false;
        let startX = 0;
        let scrollLeft = 0;
        
        tabNavigation.addEventListener('touchstart', (e) => {
            isScrolling = true;
            startX = e.touches[0].pageX - tabNavigation.offsetLeft;
            scrollLeft = tabNavigation.scrollLeft;
        });
        
        tabNavigation.addEventListener('touchmove', (e) => {
            if (!isScrolling) return;
            e.preventDefault();
            const x = e.touches[0].pageX - tabNavigation.offsetLeft;
            const walk = (x - startX) * 2;
            tabNavigation.scrollLeft = scrollLeft - walk;
        });
        
        tabNavigation.addEventListener('touchend', () => {
            isScrolling = false;
        });
    }
}

// Mejorar feedback táctil
function setupTouchFeedback() {
    if (!isMobileDevice()) return;
    
    // Añadir feedback táctil a botones
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-icon, .tab-btn');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Añadir feedback a cards
    const cards = document.querySelectorAll('.summary-card, .category-card, .transaction-item');
    cards.forEach(card => {
        card.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Mejorar modales para móviles
function setupMobileModals() {
    if (!isMobileDevice()) return;
    
    // Cerrar modal con gesto de swipe
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        let startY = 0;
        let currentY = 0;
        
        modal.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        modal.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 50) { // Swipe hacia abajo
                const modalContent = modal.querySelector('.modal-content');
                modalContent.style.transform = `translateY(${diff}px)`;
            }
        });
        
        modal.addEventListener('touchend', (e) => {
            const diff = currentY - startY;
            if (diff > 100) { // Swipe suficiente para cerrar
                const modalId = modal.id;
                closeModal(modalId);
            } else {
                const modalContent = modal.querySelector('.modal-content');
                modalContent.style.transform = 'translateY(0)';
            }
        });
    });
}

// Mejorar formularios para móviles
function setupMobileForms() {
    if (!isMobileDevice()) return;
    
    // Evitar zoom en inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="password"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            // Scroll suave al input
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });
    
    // Mejorar selectores
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        select.addEventListener('change', function() {
            // Feedback visual
            this.style.transform = 'scale(1.02)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });
}

// Skeleton loading para móviles
function showSkeletonLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
    `;
}

function hideSkeletonLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Remover skeleton y cargar contenido real
    container.innerHTML = '';
    updateUI();
}

// Mejorar performance en móviles
function setupMobilePerformance() {
    if (!isMobileDevice()) return;
    
    // Lazy loading para gráficos
    const observerOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chartCard = entry.target;
                if (chartCard.classList.contains('chart-card')) {
                    // Cargar gráfico cuando sea visible
                    setTimeout(() => {
                        updateCharts();
                    }, 100);
                }
            }
        });
    }, observerOptions);
    
    // Observar cards de gráficos
    const chartCards = document.querySelectorAll('.chart-card');
    chartCards.forEach(card => observer.observe(card));
}

// Configurar Chart.js para evitar errores de source maps
function setupChartJS() {
    // Deshabilitar source maps para Chart.js
    if (typeof Chart !== 'undefined') {
        // Configurar Chart.js para desarrollo
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#333';
        
        // Configurar para móviles
        if (isMobileDevice()) {
            Chart.defaults.font.size = 10;
            Chart.defaults.plugins.legend.labels.boxWidth = 12;
            Chart.defaults.plugins.legend.labels.padding = 8;
        }
        
        console.log('📊 Chart.js configurado correctamente');
    }
}

// Inicializar mejoras mobile
function initializeMobileEnhancements() {
    if (!isMobileDevice()) return;
    
    setupMobileNavigation();
    setupTouchFeedback();
    setupMobileModals();
    setupMobileForms();
    setupMobilePerformance();
    
    // Añadir clase CSS para móviles
    document.body.classList.add('mobile-device');
    
    console.log('🚀 Mejoras mobile inicializadas');
}

// Inicializar Chart.js cuando esté disponible
function initializeChartJS() {
    // Esperar a que Chart.js esté cargado
    if (typeof Chart !== 'undefined') {
        setupChartJS();
    } else {
        // Si no está cargado, esperar un poco más
        setTimeout(initializeChartJS, 100);
    }
}

// Función para actualizar el estado de conexión
function updateConnectionStatus() {
    const statusIndicator = document.getElementById('connectionStatus');
    const statusDot = statusIndicator.querySelector('.status-dot');
    const statusText = statusIndicator.querySelector('.status-text');
    
    if (window.cloudServices) {
        window.cloudServices.testConnection().then(result => {
            if (result.success) {
                statusDot.className = 'status-dot connected';
                statusText.textContent = 'Conectado a Firebase';
            } else {
                statusDot.className = 'status-dot error';
                statusText.textContent = 'Error de conexión';
            }
        }).catch(error => {
            statusDot.className = 'status-dot error';
            statusText.textContent = 'Error de conexión';
        });
    } else {
        statusDot.className = 'status-dot error';
        statusText.textContent = 'Servicios no disponibles';
    }
}

// Función para actualizar el estado de sincronización
function updateSyncStatus() {
    const lastSyncTime = document.getElementById('lastSyncTime');
    const lastSync = localStorage.getItem('lastSyncTime');
    
    if (lastSync) {
        const date = new Date(lastSync);
        lastSyncTime.textContent = date.toLocaleString();
    } else {
        lastSyncTime.textContent = 'Nunca';
    }
}

// Función para sincronizar a la nube con progreso
async function syncToCloud() {
    const progressBar = document.getElementById('syncProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    // Mostrar barra de progreso
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Iniciando sincronización...';
    
    try {
        // Obtener datos locales
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
        
        const totalItems = transactions.length + categories.length + budgets.length;
        let completedItems = 0;
        
        // Verificar qué sincronizar
        const syncTransactions = document.getElementById('syncTransactions').checked;
        const syncCategories = document.getElementById('syncCategories').checked;
        const syncBudgets = document.getElementById('syncBudgets').checked;
        
        const dataToSync = {};
        
        if (syncTransactions) {
            dataToSync.transactions = transactions;
            completedItems += transactions.length;
            progressFill.style.width = (completedItems / totalItems * 100) + '%';
            progressText.textContent = `Sincronizando transacciones... (${completedItems}/${totalItems})`;
        }
        
        if (syncCategories) {
            dataToSync.categories = categories;
            completedItems += categories.length;
            progressFill.style.width = (completedItems / totalItems * 100) + '%';
            progressText.textContent = `Sincronizando categorías... (${completedItems}/${totalItems})`;
        }
        
        if (syncBudgets) {
            dataToSync.budgets = budgets;
            completedItems += budgets.length;
            progressFill.style.width = (completedItems / totalItems * 100) + '%';
            progressText.textContent = `Sincronizando presupuestos... (${completedItems}/${totalItems})`;
        }
        
        // Sincronizar con Firebase
        if (window.cloudServices) {
            const result = await window.cloudServices.syncToCloud(dataToSync, getCurrentUserId());
            
            if (result) {
                // Guardar timestamp de última sincronización
                localStorage.setItem('lastSyncTime', new Date().toISOString());
                
                // Actualizar estado
                progressFill.style.width = '100%';
                progressText.textContent = 'Sincronización completada exitosamente';
                
                // Ocultar progreso después de 2 segundos
                setTimeout(() => {
                    progressBar.style.display = 'none';
                }, 2000);
                
                // Actualizar estado
                updateSyncStatus();
                updateConnectionStatus();
                
                showNotification('Sincronización completada', 'success');
            } else {
                throw new Error('Error en la sincronización');
            }
        } else {
            throw new Error('Servicios en la nube no disponibles');
        }
        
    } catch (error) {
        progressText.textContent = 'Error en la sincronización: ' + error.message;
        progressFill.style.background = '#dc3545';
        
        setTimeout(() => {
            progressBar.style.display = 'none';
            progressFill.style.background = '#007bff';
        }, 3000);
        
        showNotification('Error en la sincronización', 'error');
    }
}

// Función para sincronizar desde la nube
async function syncFromCloud() {
    if (!window.cloudServices) {
        showNotification('Servicios en la nube no disponibles', 'error');
        return;
    }
    
    try {
        const result = await window.cloudServices.syncFromCloud(getCurrentUserId());
        
        if (result) {
            // Recargar datos en la aplicación
            loadTransactions();
            loadCategories();
            loadBudgets();
            
            // Actualizar timestamp
            localStorage.setItem('lastSyncTime', new Date().toISOString());
            updateSyncStatus();
            
            showNotification('Datos sincronizados desde la nube', 'success');
        } else {
            showNotification('No hay datos en la nube', 'info');
        }
    } catch (error) {
        showNotification('Error al sincronizar desde la nube: ' + error.message, 'error');
    }
}

// Función para restaurar desde la nube
async function restoreFromCloud() {
    const restoreType = document.querySelector('input[name="restoreType"]:checked').value;
    
    if (restoreType === 'all') {
        if (confirm('¿Estás seguro de que quieres restaurar todos los datos desde la nube? Esto sobrescribirá los datos locales.')) {
            await syncFromCloud();
        }
    } else {
        // Restauración selectiva (implementar más adelante)
        showNotification('Restauración selectiva próximamente', 'info');
    }
}

// Función para cargar historial de sincronización
function loadSyncHistory() {
    const historyContainer = document.getElementById('syncHistory');
    const history = JSON.parse(localStorage.getItem('syncHistory') || '[]');
    
    if (history.length === 0) {
        historyContainer.innerHTML = '<div class="history-item"><span class="history-date">No hay historial de sincronización</span></div>';
        return;
    }
    
    historyContainer.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-date">${new Date(item.timestamp).toLocaleString()}</div>
            <div class="history-status">${item.action} - ${item.status}</div>
        </div>
    `).join('');
}



// Función para obtener ID del usuario actual
function getCurrentUserId() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return currentUser.id || 'anonymous';
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `visual-notification ${type}`;
    notification.innerHTML = `
        <div class="visual-notification-content">
            <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
            <p>${message}</p>
        </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Mostrar
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Inicializar estado de sincronización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el modal de sincronización está presente
    const cloudSyncModal = document.getElementById('cloudSyncModal');
    if (cloudSyncModal) {
        // Actualizar estado inicial
        updateConnectionStatus();
        updateSyncStatus();
        
        // Configurar sincronización automática
        const autoSyncCheckbox = document.getElementById('autoSync');
        if (autoSyncCheckbox) {
            autoSyncCheckbox.checked = localStorage.getItem('autoSync') !== 'false';
            
            autoSyncCheckbox.addEventListener('change', function() {
                localStorage.setItem('autoSync', this.checked);
            });
        }
    }
    
    // Inicializar mejoras mobile
    initializeMobileEnhancements();
    
    // Inicializar Chart.js
    initializeChartJS();
    
    console.log('📱 Aplicación inicializada con mejoras mobile');
});