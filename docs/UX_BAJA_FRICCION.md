# Guía de UI de baja fricción cognitiva — NeuroAD

Aplica a la app del paciente (`mobile/`). La web del terapeuta la sigue en lo razonable.
Base: PLAN.md §6. Aquí están los valores concretos que usa el código (`mobile/src/theme/index.ts`).

## Herramientas
- **React Native Paper** (Material 3): botones, tarjetas, campos y modal accesibles.
- **Lexend** (`@expo-google-fonts/lexend`): pesos 400 (texto), 600 (botones, títulos de tarjeta) y 700 (títulos).
- **expo-haptics**: `notificationAsync(Success)` al registrar una parálisis y al enviar su descripción.
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
- Inicio: "Hola, {nombre}" · "Si te sientes bloqueado, toca el botón. Tu terapeuta recibirá un aviso."
- Tras el toque: "Listo, tu terapeuta ya fue avisado." · campo "¿Qué pasó? (opcional)" · botones **Enviar** y **Saltar**.
- Qué hacer: "Prueba una de estas ideas. Elige la que te parezca más fácil."
- Error: "No hay conexión. Lo intentaremos de nuevo." + botón **Reintentar**.
- Vacíos: "Aún no tienes consejos. Tu terapeuta los agregará pronto." (en la Fase 7, Tareas usará "Aún no tienes tareas. Tu terapeuta las agregará pronto." cuando la lista esté vacía).

## Las 11 reglas y cómo se aplican (Fase 6)
1. **Una acción principal por pantalla:** Inicio = botón de parálisis, grande y arriba. "Salir" va abajo, como texto discreto.
2. **4 pestañas siempre visibles, ícono + texto:** Inicio · Tareas · Emociones · Qué hacer.
3. **Texto:** 18 sp, interlineado 1,5, alineado a la izquierda, sin cursivas, en segunda persona.
4. **Áreas táctiles ≥ 48 dp;** el botón de parálisis mide ≥ 120 dp y ocupa todo el ancho.
5. **Color calmo con contraste AA:** índigo profundo, sin rojo de alarma, y siempre con texto o ícono.
6. **Respuesta inmediata:** al tocar hay vibración y aparece el mensaje "Listo, tu terapeuta ya fue avisado."
7. **Sin pasos obligatorios:** la descripción es opcional y nunca se pide confirmar dos veces.
8. **Errores amables:** `ErrorMessage` muestra un mensaje y el botón Reintentar. No hay cola offline.
9. **Estados vacíos con guía:** `EmptyState` en Tareas, Emociones y Qué hacer.
10. **Sin distracciones:** sin animaciones decorativas, badges ni gamificación.
11. **Micropasos en acordeón:** se implementan en la Fase 7.

La revisión de "cumple / ajustado" contra estas 11 reglas se hace en la Fase 8.
