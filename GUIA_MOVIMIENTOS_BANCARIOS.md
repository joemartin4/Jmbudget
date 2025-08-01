# 🏦 Guía Completa: Cómo Alimentar Movimientos en JM Budget

## 📋 **Métodos Disponibles**

### **1. 📥 Importación Masiva desde CSV (Recomendado)**

#### **Paso a Paso:**
1. **Ir a la sección "Cuentas"**
2. **Hacer clic en "Importar CSV"**
3. **Seleccionar la cuenta bancaria**
4. **Subir archivo CSV desde tu banco**

#### **Formato CSV Requerido:**
```csv
fecha,descripcion,monto,tipo,categoria
2024-01-15,Supermercado,-150.50,gasto,Alimentación
2024-01-16,Salario,2500.00,ingreso,Ingresos
2024-01-17,Gasolina,-45.00,gasto,Transporte
```

#### **Columnas Soportadas:**
- **fecha/date**: Fecha de la transacción (YYYY-MM-DD)
- **descripcion/description**: Descripción del movimiento
- **monto/amount**: Cantidad (negativo para gastos, positivo para ingresos)
- **tipo/type**: "gasto" o "ingreso"
- **categoria/category**: Categoría (opcional)

### **2. 🖱️ Botón "Importar Transacciones" por Cuenta**

#### **Cómo usar:**
1. **Ir a la sección "Cuentas"**
2. **Encontrar la tarjeta de la cuenta**
3. **Hacer clic en el botón "📥" (Importar transacciones)**
4. **Seguir el proceso de importación**

### **3. ✏️ Edición Manual Individual**

#### **Para agregar transacciones manualmente:**
1. **Ir a la sección "Transacciones"**
2. **Hacer clic en "Nuevo Gasto" o "Nuevo Ingreso"**
3. **Completar el formulario**
4. **Seleccionar la cuenta bancaria asociada**

## 🏛️ **Formatos de Bancos Soportados**

### **Banco Popular (República Dominicana):**
```csv
Fecha,Descripción,Monto,Saldo
2024-01-15,SUPERMERCADO NACIONAL,-150.50,1250.00
2024-01-16,TRANSFERENCIA RECIBIDA,500.00,1750.00
```

### **Banco de Reservas:**
```csv
Fecha,Concepto,Debito,Credito,Saldo
2024-01-15,SUPERMERCADO,150.50,,1250.00
2024-01-16,SALARIO,,500.00,1750.00
```

### **Banco BHD León:**
```csv
Fecha,Descripción,Débito,Crédito
2024-01-15,SUPERMERCADO,150.50,
2024-01-16,SALARIO,,500.00
```

### **Scotiabank:**
```csv
Fecha,Descripción,Monto,Tipo
2024-01-15,SUPERMERCADO,-150.50,DEBITO
2024-01-16,SALARIO,500.00,CREDITO
```

## 💳 **Para Tarjetas de Crédito**

### **Proceso Especial:**
1. **Crear la tarjeta de crédito** con límite y fechas
2. **Importar movimientos** usando el mismo proceso
3. **Los movimientos se categorizan automáticamente**
4. **El balance se calcula automáticamente**

### **Ejemplo CSV para Tarjeta de Crédito:**
```csv
fecha,descripcion,monto,tipo
2024-01-15,AMAZON.COM,-89.99,gasto
2024-01-16,NETFLIX,-12.99,gasto
2024-01-17,PAGO TARJETA,500.00,ingreso
```

## 🔧 **Proceso de Conciliación**

### **Después de importar:**
1. **Revisar transacciones importadas**
2. **Categorizar movimientos no categorizados**
3. **Verificar que los montos coincidan**
4. **Conciliar con el estado de cuenta del banco**

### **Herramientas de Conciliación:**
- **Filtros por fecha**
- **Búsqueda por descripción**
- **Agrupación por categoría**
- **Comparación de saldos**

## 📱 **Desde Móvil**

### **Proceso Simplificado:**
1. **Abrir JM Budget en el navegador móvil**
2. **Ir a "Cuentas"**
3. **Hacer clic en "Importar CSV"**
4. **Seleccionar archivo desde el dispositivo**
5. **Confirmar importación**

## ⚠️ **Consejos Importantes**

### **Antes de Importar:**
- ✅ **Verificar formato del CSV**
- ✅ **Hacer backup de datos actuales**
- ✅ **Revisar que las fechas estén en formato correcto**
- ✅ **Asegurar que los montos no tengan símbolos de moneda**

### **Después de Importar:**
- ✅ **Revisar transacciones duplicadas**
- ✅ **Categorizar movimientos automáticamente**
- ✅ **Verificar saldos finales**
- ✅ **Conciliar con estado de cuenta**

## 🆘 **Solución de Problemas**

### **Error: "Formato no válido"**
- Verificar que el CSV tenga encabezados correctos
- Asegurar que las fechas estén en formato YYYY-MM-DD
- Revisar que no haya caracteres especiales

### **Error: "Transacciones duplicadas"**
- Usar la función "Arreglar Cuentas Duplicadas"
- Revisar fechas y montos idénticos
- Eliminar duplicados manualmente si es necesario

### **Error: "Saldo no coincide"**
- Verificar que los montos estén en el formato correcto
- Revisar que los signos (+/-) estén correctos
- Conciliar manualmente las diferencias

## 📞 **Soporte**

Si tienes problemas con la importación:
1. **Revisar la consola del navegador** (F12)
2. **Verificar el formato del archivo CSV**
3. **Probar con un archivo pequeño primero**
4. **Contactar soporte si persiste el problema**

---

**¡Con estos métodos puedes mantener tus cuentas bancarias y tarjetas de crédito completamente actualizadas en JM Budget!** 🎉 