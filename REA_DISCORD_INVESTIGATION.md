# Investigação REA — Discord local

Data da análise: 2026-11-16  
Escopo: instalação local do Discord Desktop, componentes Electron, wrapper JavaScript de voz e módulos nativos. A análise não acessou credenciais, conteúdo de chamadas, nem tentou contornar proteções.

## Resultado executivo

O Discord Desktop analisado usa uma arquitetura em camadas:

```text
renderer/web do Discord
        ↓
DiscordNative exposto por contextBridge
        ↓
IPC dinâmico e controlado entre renderer/preload/main
        ↓
carregador de módulos nativos
        ↓
discord_voice.node + discord_media.node
        ↓
áudio, vídeo, UDP, captura, estatísticas e criptografia de mídia
```

A voz, o vídeo e o Go Live compartilham a abstração `VoiceConnection`. O que diferencia uma chamada somente de voz de uma sessão com vídeo é a ativação de fontes/sinks e callbacks de vídeo, captura de desktop, soundshare e dispositivos de vídeo. Isso é uma inferência arquitetural baseada nos wrappers observados; a seleção efetiva de recursos em uma sessão específica não foi executada.

## Evidências principais

| Evidência | Artefato | Observação | Limitação |
|---|---|---|---|
| `ev_bd7615318499dc0941f7166cb8beb5434f9b87ea22c8f618a690a140252d26c8` | `app.asar` | Launcher/bootstrap do Discord; inventário completo. | Não contém toda a aplicação web da interface. |
| `ev_e664d58eccd528c38cd313403c30488e84a8d17433e0c27ac60920221abd176f` | `core.asar` | Preload, ponte para o renderer e carregamento de módulos nativos. | Análise estática; chamadas IPC dinâmicas não foram resolvidas em runtime. |
| `ev_e6de8b9b327089cd3f94847a5fbdb6a609b0f62a3b8f6f501d6dcd60710afe8c` | `discord_voice/index.js` | Grafo JavaScript completo para os arquivos selecionados; wrapper de conexão, áudio, vídeo, UDP, MLS e estatísticas. | 478 arquivos do diretório foram inventariados, mas não selecionados; o código nativo não foi decompilado. |
| `ev_09582ad805f39b1cd1d057e24df27b8eb669419e4b895ecc5dc8def32c229d9d` | `discord_voice.node` | Addon nativo PE de 22.408.120 bytes. | Sem Ghidra/Hopper/IDA disponível; não atribuir detalhes internos ao binário. |
| `ev_89c3612f0a473bb48be81bb2df6afb5e9e6cc85bf6256a1bf3cc7ec730a3868a` | `discord_media.node` | Addon nativo PE de 722.872 bytes. | Mesmo limite de análise nativa. |
| `ev_7a03d6957b9a8d6116a809d258f9d46aee841bcbf60d2dc817d66e0814b3a67a` | `mainScreenPreload.js` | `DiscordNative`, `contextBridge`, carregador nativo e operações IPC. | Sem observação de uma sessão real. |
| `ev_aeeaa66cc66b545b7d0df4e078854dcbaa7fdb49ffc9cd1e2af13c6e520dee83` | `Discord.exe` | Fuses Electron e implicações de carregamento/inspeção. | Não prova que não exista alguma forma de depuração ativada pelo próprio código. |

## Como a camada de voz funciona

No arquivo local `C:\Users\Pedro\AppData\Local\Discord\app-1.0.9267\modules\discord_voice-1\discord_voice\index.js`, o wrapper expõe uma conexão nativa com operações para:

- criar/destruir conexão, configurar transporte e reconexão UDP;
- mute/deafen local, estado de fala remoto, PTT, volume, pan e posição do usuário;
- endpoint UDP, ping, timeout, marcadores de log e estatísticas filtradas;
- callbacks de falha de conexão, speaking e mudança de mute nativo;
- seleção de dispositivos de áudio e vídeo;
- estado de criptografia de frames e operações MLS;
- callbacks e sinks de vídeo, primeiro frame e estatísticas de entrega/criptografia.

O método `VoiceEngine.createVoiceConnectionWithOptions` instancia `VoiceEngine.VoiceConnection` e o envolve com esse wrapper. `createOwnStreamConnectionWithOptions` aponta para a mesma criação; há também uma conexão separada para replay.

## Modalidades observadas

### Chamada somente de voz

Usa a mesma `VoiceConnection`, transporte UDP, dispositivos de áudio, mute/deafen, speaking status, ping e estatísticas. Não há necessidade de registrar fonte ou sink de vídeo.

### Chamada com vídeo

O wrapper declara suporte a `media_video`, `electron_video`, `simulcast`, `direct_video`, `first_frame_callback` e múltiplos streams remotos. Também há `setOnVideoCallback`, `setVideoOutputSink`, `getNextVideoOutputFrame` e callbacks de primeiro frame.

Isso sustenta a conclusão de que vídeo é uma extensão da sessão de mídia, não uma chamada completamente separada. A resolução, codec escolhido e parâmetros efetivos por sessão permanecem desconhecidos nesta análise.

### Compartilhamento de tela / Go Live

Foram observadas operações `setDesktopSource`, `setDesktopSourceWithOptions`, `setGoLiveDevices`, `clearDesktopSource`, callbacks de encerramento/falha e `soundshare`. No preload também aparecem recursos IPC de captura de desktop, captura de janela, `getMediaSourceId` e eventos de ciclo de vida do stream.

A leitura mais provável é: o renderer escolhe uma fonte, o preload obtém/valida o identificador via IPC e a camada nativa recebe a fonte e seus dispositivos. O fluxo exato de permissão e seleção de janela não foi executado.

### Criptografia de mídia

O wrapper expõe transições de secure frames e operações MLS, incluindo geração de key package, propostas, commit/welcome e fingerprint pairwise. Isso comprova a existência dessas interfaces no build analisado, mas não permite afirmar, apenas estaticamente, qual modo foi usado em uma chamada concreta, nem os algoritmos internos do addon nativo.

## “Salas”, canais e protocolo

Esta execução não encontrou evidência suficiente para descrever com precisão o modelo de sala, os eventos Gateway, payloads REST, códigos de operação ou mensagens de negociação de uma chamada. O motivo é importante: o `app.asar` local é principalmente bootstrap, o preload expõe a ponte nativa, e a lógica web/servidor não foi observada em uma sessão real.

Portanto, não seria correto afirmar a partir desta coleta isolada:

- quais mensagens criam, atualizam ou encerram uma sala;
- quais IDs representam servidor, canal, sessão ou stream;
- quais endpoints e payloads são usados;
- como a negociação escolhe codec, bitrate, simulcast ou fallback;
- como o servidor decide quem pode falar, transmitir vídeo ou fazer Go Live.

## Observado, inferido e desconhecido

**Observado diretamente:** nomes e chamadas do wrapper JavaScript; carregamento de `discord_voice`, `discord_media` e outros módulos; ponte `DiscordNative`; IPC dinâmico; interfaces de áudio, vídeo, UDP, desktop capture, soundshare, secure frames e MLS; flags declaradas de suporte.

**Inferido com boa confiança:** voz, vídeo e Go Live são modalidades da mesma camada de conexão de mídia; sinks/sources/callbacks de vídeo são ativados apenas quando necessários; o renderer não acessa diretamente o addon nativo, passando pelo preload/IPC.

**Ainda desconhecido:** detalhes internos dos PE nativos; tráfego e protocolo de rede; semântica exata de “salas”; valores padrão e negociação por sessão; comportamento efetivo de flags; conteúdo de áudio/vídeo e estado de uma chamada real.

## Próxima etapa possível

Para fechar as partes de “salas” e protocolo, seria necessário um segundo passe de observação dinâmica com o Discord aberto e uma sessão controlada, capturando apenas metadados técnicos de processos, chamadas IPC e eventos de conexão — sem coletar áudio, vídeo, tokens ou conteúdo privado. A instalação não estava em execução durante esta análise, então essa etapa não foi realizada.

