# Guía de UI de baja fricción cognitiva — NeuroAD

Aplica a la app del paciente (`mobile/`). La web del terapeuta la sigue en lo razonable.
Base: PLAN.md §6. Aquí están los valores concretos que usa el código (`mobile/src/theme/index.ts`).

## Herramientas
- **React Native Paper** (Material 3): botones, tarjetas, campos y modal accesibles.
- **Lexend** (`@expo-google-fonts/lexend`): pesos 400 (texto), 600 (botones, títulos de tarjeta) y 700 (títulos).
- **Vibración** (`src/haptics.ts` → `vibrate()`): expo-haptics `notificationAsync(Success)`; si el módulo nativo no está (Expo Go 58 en Android), `Vibration` de React Native. Se usa al abrir el panel y al enviar una parálisis, al dar feedback a una tarea, al registrar una emoción y al deshacerla.
- **@expo/vector-icons** (MaterialCommunityIcons): siempre junto a un texto.

## Colores
| Uso | Color | Contraste |
|---|---|---|
| Primario (botón de parálisis, pestaña activa) | `#303F9F` índigo profundo | 9,8:1 con texto blanco |
| Fondo | `#F5F6FA` gris muy suave | — |
| Superficie (tarjetas, encabezado, modal) | `#FFFFFF` | — |
| Texto | `#1F2333` | > 14:1 sobre el fondo |
| Texto secundario / pestaña inactiva | `#4A5068` | 7,9:1 sobre el fondo |
| Confirmación ("Listo…") | `#2E7D57` | AA sobre blanco |
| Error | `#B3261E` sobre `#FCEEEE` | AA |

Sin rojo para el botón de parálisis. El color nunca va solo: siempre hay texto o ícono.

## Tamaños
| Elemento | Valor |
|---|---|
| Texto base (`bodyLarge`) | 18 sp, interlineado 27 (1,5) |
| Texto de botón (`labelLarge`) | 18 sp, Lexend 600 |
| Títulos de pantalla | 26 sp (saludo), 22 sp (encabezado de pestaña) |
| Título de consejo (`titleMedium`) | 20 sp, Lexend 600 |
| Botón de parálisis | alto ≥ 120 dp, ancho completo, texto 26 sp |
| Otros botones | alto ≥ 56 dp, ancho completo |
| Área táctil mínima | 48 dp (incluye "Salir") |
| Íconos de pestaña | 28 dp + texto 13 sp |
| Márgenes | 24 dp de borde de pantalla, 16–24 dp entre bloques |

Los tamaños son `sp`: respetan el tamaño de letra del sistema.

## Textos tipo
- Login: "Entra con el correo y la contraseña que te dio tu terapeuta."
- Inicio: "Hola, {nombre}" · "Si te sientes bloqueado, toca el botón. Luego toca Enviar para avisar a tu terapeuta."
- Tras el toque: panel "Avisa a tu terapeuta" · campo "¿Qué pasó? (opcional)" · botones **Enviar** (con o sin texto; crea el reporte y lleva a Qué hacer) y **Salir** (cierra el panel sin enviar y vuelve a Inicio).
- Tras Enviar: aviso abajo, sobre Qué hacer, "Listo, tu terapeuta ya fue avisado." (4 s).
- Qué hacer: "Prueba una de estas ideas. Elige la que te parezca más fácil."
- Error: "No hay conexión. Lo intentaremos de nuevo." + botón **Reintentar**.
- Vacíos: "Aún no tienes consejos. Tu terapeuta los agregará pronto." · "Aún no tienes tareas. Tu terapeuta las agregará pronto."
- Tareas: "Toca una tarea para ver sus pasos. Marca cada paso cuando lo hagas." · "¿Te sirvió esta tarea?" · **Me sirvió 👍** / **No me sirvió 👎**.
- Emociones: "¿Cómo te sientes ahora?" · "Elige una emoción y toca Enviar." · snackbar "Guardado: Calma · Deshacer" (5 s) · "Último registro: Calma, 14:32".

## Revisión de las 11 reglas (Fase 8)
Revisión hecha en el código y en un Motorola edge 60 fusion (Expo Go), recorriendo el guion de demo completo.
**Cumple** = ya estaba bien. **Ajustado** = se corrigió en la Fase 8.

| # | Regla | Estado | Cómo se cumple |
|---|---|---|---|
| 1 | Una acción principal por pantalla | Cumple | Inicio: botón de parálisis grande y arriba; "Salir" abajo y discreto. Emociones: Enviar fijo abajo. Tareas: una tarjeta abierta a la vez. |
| 2 | 4 pestañas visibles, ícono + texto | Ajustado | Inicio · Tareas · Emociones · Qué hacer, ícono de 28 dp + texto. Ajuste: el lector de pantalla leía también el glifo del ícono; ahora cada pestaña tiene `tabBarAccessibilityLabel` con solo su nombre. |
| 3 | Texto 18 sp, interlineado 1,5, izquierda, sin cursivas, 2ª persona | Cumple | `bodyLarge` 18/27, Lexend. No hay `italic` ni texto justificado. Textos en segunda persona (ver "Textos tipo"). |
| 4 | Áreas táctiles ≥ 48 dp; parálisis ≥ 120 dp y ancho completo | Cumple | `BigButton` ≥ 56 dp (parálisis 120 dp, ancho completo); "Salir" 48 dp; pasos 48 dp; encabezado de tarea 64 dp; celdas de emoción 96 dp; barra de pestañas 64 dp. |
| 5 | Color calmo, contraste AA, color nunca solo | Cumple | Índigo `#303F9F` (9,8:1). Selección de emoción = borde + ✓; feedback = relleno + ✓; error = ícono + texto. |
| 6 | Respuesta inmediata: vibración + mensaje | Cumple | `vibrate()` en parálisis, feedback y emociones. Mensajes: "Listo, tu terapeuta ya fue avisado.", "Guardado: X · Deshacer", botón elegido con ✓. |
| 7 | Cero pasos obligatorios innecesarios | Cumple | Descripción opcional; Enviar una sola vez, sin confirmar dos veces. El toque en la grilla solo selecciona (pedido del usuario en Fase 7), así se evita registrar por error. |
| 8 | Errores amables y accionables | Cumple | `ErrorMessage`: "No hay conexión. Lo intentaremos de nuevo." + Reintentar, en las 4 pestañas y en el panel de parálisis. |
| 9 | Estados vacíos con guía | Cumple | Tareas y Qué hacer con `EmptyState`. Emociones no lo necesita: el catálogo siempre tiene 10 emociones. |
| 10 | Sin distracciones; respeta "reducir movimiento" y tamaño de fuente | Ajustado | Sin animaciones decorativas, badges ni gamificación; tamaños en sp. Ajuste: si el sistema pide reducir movimiento (Android: "Quitar animaciones"), la escala de animación de Paper pasa a 0 y el panel y las snackbars aparecen sin transición (`app/_layout.tsx`). |
| 11 | Micropasos en acordeón, numerados, checkbox local | Cumple | `TaskCard` (una abierta a la vez) + `MicroStepList` numerada; los checks viven solo en memoria. |
