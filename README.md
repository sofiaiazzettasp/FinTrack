[README.md](https://github.com/user-attachments/files/30007339/README.md)
# 🎯 FinTrack — Simulador de Conciencia Financiera

> Una Single Page Application (SPA) interactiva para entrenar el hábito del ahorro y combatir la ansiedad económica.

---

## 🌍 Propósito Social
La banca tradicional suele ofrecer interfaces frías y confusas que generan estrés financiero. **FinTrack** humaniza la gestión del dinero aplicando la psicología del diseño (UX): un entorno seguro y lúdico para que los usuarios comprendan el impacto de sus decisiones en tiempo real y sin riesgos.

---

## 🔑 Características Clave

* **📊 Dashboard SPA:** Visualización en tiempo real de ingresos, gastos y balances sin recargar la página.
* **🎯 Mi Hucha:** Módulo de metas de ahorro con barras de progreso dinámicas que descuentan el saldo disponible.
* **🔐 Flujo de Acceso:** Sistema completo de registro, inicio de sesión y recuperación de contraseña simulada.
* **👤 Perfil Personal:** Generación de IBAN ficticio y edición de datos del usuario.

---

## 🛠️ Stack Tecnológico

* **HTML5 Semántico:** Estructura limpia orientada a la accesibilidad (A11y).
* **CSS3 Moderno:** Layout responsivo (*Mobile-First*) con CSS Grid, Flexbox y variables de color personalizadas.
* **JavaScript Vanilla (ES6+):** Programación reactiva nativa para la gestión de estados y manipulación del DOM.

---

## ⚙️ Detalles Técnicos de Implementación

* **Almacenamiento en LocalStorage:** Al ser un desarrollo puramente Front-End, no depende de bases de datos externas de servidor. Toda la información del sistema (el registro de cuentas registradas, el historial de movimientos de transacciones, los objetivos de ahorro y el estado de la sesión activa) se almacena y gestiona de forma persistente directamente en el **`localStorage` de Google / navegador web del usuario**. Esto permite que el usuario pueda iniciar y cerrar sesión de manera persistente incluso si cierra la pestaña o reinicia el equipo.
* **Simulación Client-Side:** El sistema de login, registro y restauración de contraseñas simula de manera local los flujos de seguridad que en producción se delegarían de forma segura a un servidor, garantizando que el prototipo de portafolio sea 100% funcional y autónomo.
