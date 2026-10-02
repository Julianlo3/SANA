<!-- responsable: [PENDIENTE: asignar] | estado: borrador -->
# 10. Integraciones externas

| Servicio | Uso | Estado |
|---|---|---|
| Google OAuth 2.0 | Autenticación | Implementado |
| Resend o SendGrid | Correo transaccional (recordatorios, notificaciones) | [PENDIENTE] |
| WhatsApp Business Cloud API vía BSP (Twilio o 360dialog) | Recordatorios de citas | [PENDIENTE: inclusión en el MVP] |
| Wompi | Donaciones en línea | [PENDIENTE] |

Análisis de costos: el correo tiene costo prácticamente nulo; WhatsApp tiene costo bajo para el volumen esperado en Colombia; SMS es la alternativa de mayor costo y se descarta.

[CONFIRMAR: tipo de cuenta bancaria de la fundación (personal o empresarial). Si no es empresarial, la integración con Wompi puede no ser viable y la donación se implementa como publicación de medios de pago con registro manual en estado "por verificar".]

Toda integración DEBE implementarse detrás de una interfaz propia (ver 5.4) y contar con un doble de prueba.
