# 🌐 Webserver em Modo AP - GardenAway ESP32

## 📋 O que foi implementado

O ESP32 agora funciona em **modo AP (Access Point)** com um webserver local para monitorização em tempo real da estufa.

## ✨ Funcionalidades

### 1. **Modo Dual WiFi (AP + Station)**
- **Access Point**: O ESP32 cria sua própria rede WiFi
  - **SSID**: `GardenAway-ESP32`
  - **Password**: `greenhouse123`
  - **IP do AP**: `192.168.4.1`

- **Station Mode**: Tenta conectar ao WiFi configurado para MQTT
  - Se a conexão falhar, o sistema continua funcionando apenas em modo AP
  - MQTT é opcional e não bloqueia a operação

### 2. **Webserver Local**
- Interface web elegante e minimalista
- Atualização automática a cada 2 segundos
- Acessível em: **http://192.168.4.1**

### 3. **Dados Disponíveis**
- 🌡️ Temperatura (°C)
- 💧 Humidade (%)
- ☀️ Luminosidade (lux)
- 🚰 Nível do tanque de água
- 💦 Estado da bomba
- 🔥 Estado do aquecimento
- 💡 Estado dos LEDs
- 🌀 Estado da ventoinha

## 🚀 Como usar

### 1. **Upload do código**
```bash
cd /home/vasco-debian/Desktop/DEV/Versioned/College/IoT-greenhouse/ESP32
/home/vasco-debian/.platformio/penv/bin/platformio run --target upload
```

### 2. **Conectar ao AP**
1. Procure a rede WiFi `GardenAway-ESP32` no seu dispositivo
2. Conecte-se usando a password: `greenhouse123`
3. Abra o navegador e aceda: `http://192.168.4.1`

### 3. **Monitor Serial**
Para ver os logs do sistema:
```bash
/home/vasco-debian/.platformio/penv/bin/platformio device monitor
```

## 📁 Ficheiros Modificados

### `src/mqtt/client.cpp`
- **Função `initWiFi()`**: Modificada para iniciar em modo AP+STA
- Cria o Access Point antes de tentar conectar ao WiFi
- Sistema continua funcionando mesmo sem WiFi/MQTT

### `src/main.cpp`
- Adicionados includes do webserver
- `setup()`: Inicializa o webserver após WiFi
- `loop()`: Processa o webserver a cada iteração
- Atualiza dados do webserver após cada leitura de sensores

### `src/webserver/server.cpp`
- Implementa endpoints:
  - `/` - Interface HTML
  - `/data` - API JSON com dados atuais

## 🔧 Configuração do AP

Para alterar as credenciais do Access Point, edite em `src/mqtt/client.cpp`:

```cpp
WiFi.softAP("GardenAway-ESP32", "greenhouse123");
```

Substitua:
- `"GardenAway-ESP32"` pelo SSID desejado
- `"greenhouse123"` pela password desejada

## 📊 API Endpoint

### GET `/data`
Retorna JSON com os dados atuais:

```json
{
  "temperature": 24.5,
  "humidity": 65.0,
  "light": 850,
  "tank_level": true,
  "pump": false,
  "heating": false,
  "led": true,
  "fan": false,
  "last_update": 125430
}
```

## ⚡ Performance

- **RAM**: 14.7% utilizada (48224 bytes de 327680 bytes)
- **Flash**: 65.3% utilizada (855489 bytes de 1310720 bytes)
- **Webserver**: Processamento assíncrono, não bloqueia o loop principal
- **Atualização**: Dados atualizados a cada ciclo de leitura (configurable em `CYCLE_INTERVAL`)

## 🎯 Vantagens

1. ✅ **Acesso local direto** - Não precisa de router/internet
2. ✅ **Backup robusto** - Se WiFi/MQTT falhar, o webserver continua
3. ✅ **Baixa latência** - Comunicação direta com o ESP32
4. ✅ **Fácil debug** - Interface visual para testar sensores/actuadores
5. ✅ **Mobile-friendly** - Responsive design funciona em qualquer dispositivo

## 🔍 Troubleshooting

### Não consigo ver a rede WiFi
- Verifique se o ESP32 iniciou corretamente (monitor serial)
- Aproxime-se do dispositivo (alcance ~50m)

### Página não carrega
- Confirme que está conectado à rede `GardenAway-ESP32`
- Aceda exatamente a `http://192.168.4.1` (não HTTPS)
- Tente limpar a cache do navegador

### Dados não atualizam
- Verifique o monitor serial para erros
- Confirme que os sensores estão a ser lidos corretamente
- F5 no navegador para forçar atualização

## 📝 Notas

- O webserver usa ~2KB de RAM adicional
- Compilação bem-sucedida confirmada ✅
- Compatível com modo TEST e PRODUCTION
