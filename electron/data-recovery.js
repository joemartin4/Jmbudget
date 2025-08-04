const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Script de Recuperación de Datos para JM Budget
 * Ayuda a migrar datos desde el navegador web a la aplicación de Electron
 */
class DataRecovery {
    constructor() {
        this.electronDataDir = path.join(os.homedir(), '.jm-budget');
        this.chromeDataDir = this.getChromeDataDir();
        this.safariDataDir = this.getSafariDataDir();
        this.firefoxDataDir = this.getFirefoxDataDir();
    }

    getChromeDataDir() {
        const platform = process.platform;
        const homeDir = os.homedir();
        
        switch (platform) {
            case 'darwin': // macOS
                return path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'Local Storage', 'leveldb');
            case 'win32': // Windows
                return path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Local Storage', 'leveldb');
            case 'linux': // Linux
                return path.join(homeDir, '.config', 'google-chrome', 'Default', 'Local Storage', 'leveldb');
            default:
                return null;
        }
    }

    getSafariDataDir() {
        if (process.platform === 'darwin') {
            return path.join(os.homedir(), 'Library', 'Safari', 'LocalStorage');
        }
        return null;
    }

    getFirefoxDataDir() {
        const platform = process.platform;
        const homeDir = os.homedir();
        
        switch (platform) {
            case 'darwin': // macOS
                return path.join(homeDir, 'Library', 'Application Support', 'Firefox', 'Profiles');
            case 'win32': // Windows
                return path.join(homeDir, 'AppData', 'Roaming', 'Mozilla', 'Firefox', 'Profiles');
            case 'linux': // Linux
                return path.join(homeDir, '.mozilla', 'firefox');
            default:
                return null;
        }
    }

    async scanForJMBudgetData() {
        console.log('🔍 Escaneando datos de JM Budget...');
        
        const foundData = {
            chrome: null,
            safari: null,
            firefox: null,
            electron: null
        };

        // Buscar en Chrome
        if (this.chromeDataDir && fs.existsSync(this.chromeDataDir)) {
            foundData.chrome = await this.scanChromeData();
        }

        // Buscar en Safari
        if (this.safariDataDir && fs.existsSync(this.safariDataDir)) {
            foundData.safari = await this.scanSafariData();
        }

        // Buscar en Firefox
        if (this.firefoxDataDir && fs.existsSync(this.firefoxDataDir)) {
            foundData.firefox = await this.scanFirefoxData();
        }

        // Buscar en Electron
        if (fs.existsSync(this.electronDataDir)) {
            foundData.electron = await this.scanElectronData();
        }

        return foundData;
    }

    async scanChromeData() {
        try {
            const files = fs.readdirSync(this.chromeDataDir);
            const jmBudgetFiles = files.filter(file => 
                file.includes('joemartin4.github.io') || 
                file.includes('localhost') ||
                file.includes('jm-budget')
            );

            if (jmBudgetFiles.length > 0) {
                console.log('✅ Datos encontrados en Chrome');
                return {
                    source: 'Chrome',
                    files: jmBudgetFiles,
                    path: this.chromeDataDir
                };
            }
        } catch (error) {
            console.error('Error escaneando Chrome:', error);
        }
        return null;
    }

    async scanSafariData() {
        try {
            const files = fs.readdirSync(this.safariDataDir);
            const jmBudgetFiles = files.filter(file => 
                file.includes('joemartin4.github.io') || 
                file.includes('localhost') ||
                file.includes('jm-budget')
            );

            if (jmBudgetFiles.length > 0) {
                console.log('✅ Datos encontrados en Safari');
                return {
                    source: 'Safari',
                    files: jmBudgetFiles,
                    path: this.safariDataDir
                };
            }
        } catch (error) {
            console.error('Error escaneando Safari:', error);
        }
        return null;
    }

    async scanFirefoxData() {
        try {
            const profiles = fs.readdirSync(this.firefoxDataDir);
            for (const profile of profiles) {
                if (profile.endsWith('.default') || profile.endsWith('.default-release')) {
                    const storagePath = path.join(this.firefoxDataDir, profile, 'storage', 'default');
                    if (fs.existsSync(storagePath)) {
                        const domains = fs.readdirSync(storagePath);
                        const jmBudgetDomain = domains.find(domain => 
                            domain.includes('joemartin4.github.io') || 
                            domain.includes('localhost') ||
                            domain.includes('jm-budget')
                        );

                        if (jmBudgetDomain) {
                            console.log('✅ Datos encontrados en Firefox');
                            return {
                                source: 'Firefox',
                                domain: jmBudgetDomain,
                                path: path.join(storagePath, jmBudgetDomain)
                            };
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error escaneando Firefox:', error);
        }
        return null;
    }

    async scanElectronData() {
        try {
            if (fs.existsSync(this.electronDataDir)) {
                const files = fs.readdirSync(this.electronDataDir);
                const dataFiles = files.filter(file => file.endsWith('.json'));
                
                if (dataFiles.length > 0) {
                    console.log('✅ Datos encontrados en Electron');
                    return {
                        source: 'Electron',
                        files: dataFiles,
                        path: this.electronDataDir
                    };
                }
            }
        } catch (error) {
            console.error('Error escaneando Electron:', error);
        }
        return null;
    }

    async createRecoveryBackup() {
        console.log('💾 Creando backup de recuperación...');
        
        const recoveryDir = path.join(this.electronDataDir, 'recovery');
        if (!fs.existsSync(recoveryDir)) {
            fs.mkdirSync(recoveryDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(recoveryDir, `recovery-${timestamp}.json`);

        const scanResults = await this.scanForJMBudgetData();
        
        const recoveryData = {
            timestamp: Date.now(),
            version: '2.0.21',
            scanResults: scanResults,
            instructions: [
                '1. Este archivo contiene información sobre datos encontrados',
                '2. Los datos pueden estar en diferentes navegadores',
                '3. Usa la función de migración en la aplicación',
                '4. Si no funciona, contacta al soporte'
            ]
        };

        fs.writeFileSync(backupPath, JSON.stringify(recoveryData, null, 2));
        console.log('✅ Backup de recuperación creado:', backupPath);
        return backupPath;
    }

    async showRecoveryInstructions() {
        console.log('\n🆘 INSTRUCCIONES DE RECUPERACIÓN DE DATOS');
        console.log('==========================================');
        console.log('');
        console.log('Si perdiste tus datos al abrir la aplicación de Electron:');
        console.log('');
        console.log('1. 📱 Abre la aplicación web en tu navegador:');
        console.log('   https://joemartin4.github.io/Jmbudget/');
        console.log('');
        console.log('2. 🔄 Haz un backup de tus datos desde la web');
        console.log('   - Ve a Configuración > Backup y Restauración');
        console.log('   - Haz clic en "Crear Backup"');
        console.log('');
        console.log('3. 💾 Descarga el archivo de backup');
        console.log('');
        console.log('4. 🖥️ En la aplicación de Electron:');
        console.log('   - Ve a Configuración > Backup y Restauración');
        console.log('   - Haz clic en "Restaurar Backup"');
        console.log('   - Selecciona el archivo descargado');
        console.log('');
        console.log('5. ✅ Tus datos deberían restaurarse correctamente');
        console.log('');
        console.log('Si el problema persiste, ejecuta este script:');
        console.log('   node electron/data-recovery.js');
        console.log('');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const recovery = new DataRecovery();
    recovery.showRecoveryInstructions();
    recovery.createRecoveryBackup().then(() => {
        console.log('✅ Script de recuperación completado');
    });
}

module.exports = DataRecovery; 