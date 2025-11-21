# 🚀 Como Usar o Gerador de Cards Instagram

## ✅ Setup Concluído

O ambiente virtual foi configurado e as dependências instaladas com sucesso!

## 📱 Modo de Uso

### 1️⃣ **Modo Automático (Testes)**
Execute testes rápidos e crie 3 cards de exemplo:
```powershell
cd "c:\Users\madet\OneDrive\Desktop\Marketing Madetech\Planilhas CRM\CRM MArketing\instagram-card-generator"
venv\Scripts\activate
python main.py
```

**Resultado:**
- ✅ 1 card com texto personalizado
- ✅ 1 card com conteúdo gerado por IA (Google AI Studio)
- ✅ 1 card com tema light

### 2️⃣ **Modo Interativo**
Crie cards de forma interativa com menu de opções:
```powershell
python interactive.py
```

**Opções disponíveis:**
1. 📝 Gerar card com texto personalizado
2. 🤖 Gerar card com conteúdo gerado por IA
3. 📊 Gerar múltiplos cards em lote
4. 📁 Ver cards gerados
5. 🚪 Sair

### 3️⃣ **Modo em Lote**
Gere múltiplos cards automaticamente:
```powershell
python generate_batch.py
```

## 📊 Especificações dos Cards

- **Dimensões:** 1080x1920px (Tamanho Instagram Story/Reels)
- **Formato:** PNG
- **Localização:** Pasta `output/`

## 🎨 Temas Disponíveis

| Tema | Fundo | Texto Principal | Acentuação |
|------|-------|-----------------|-----------|
| **dark** | Cinza Escuro | Branco | Azul |
| **light** | Branco | Cinza Escuro | Vermelho |
| **gradient** | Teal Gradiente | Branco | Rosa |

## 🤖 Modelos IA Disponíveis

Atualmente usando: **Google Gemini 2.0 Flash**

Modelos alternos disponíveis:
- `gemini-2.5-flash` (Mais novo, mais rápido)
- `gemini-2.5-pro` (Mais preciso)
- `gemini-2.0-flash` (Padrão atual)

Para trocar: edite em `main.py` - `self.model = genai.GenerativeModel("modelo_aqui")`

## 📝 Exemplos de Uso

### Exemplo 1: Card Simples
```python
from main import InstagramCardGenerator

generator = InstagramCardGenerator(theme="dark")
img = generator.create_card(
    title="Marketing Digital",
    subtitle="Estratégias que funcionam"
)
generator.save_card(img, "meu_card.png")
```

### Exemplo 2: Com Conteúdo IA
```python
from main import InstagramCardGenerator

generator = InstagramCardGenerator(theme="light")
content = generator.generate_content(
    "Crie um título curto sobre e-commerce"
)
img = generator.create_card(title=content.strip())
generator.save_card(img, "ai_card.png")
```

### Exemplo 3: Múltiplos Cards
```bash
python interactive.py
# Escolha opção 3 (Gerar múltiplos cards)
```

## 🛠️ Customização

### Editar Cores
Abra `config.py` e modifique o dicionário `THEMES`:
```python
'dark': {
    'background': (31, 41, 55),      # RGB
    'primary_text': (255, 255, 255),
    'secondary_text': (200, 200, 200),
    'accent': (59, 130, 246),
}
```

### Editar Tamanhos de Fonte
Em `config.py`, modifique `FONTS`:
```python
FONTS = {
    'title': 60,
    'subtitle': 40,
    'body': 28,
    'small': 20,
}
```

### Trocar Dimensões
Em `config.py`:
```python
CARD_WIDTH = 1080   # Largura em pixels
CARD_HEIGHT = 1920  # Altura em pixels
```

## 📂 Estrutura do Projeto

```
instagram-card-generator/
├── main.py                 # Script principal
├── config.py              # Configurações
├── interactive.py         # Modo interativo
├── generate_batch.py      # Gerador em lote
├── requirements.txt       # Dependências
├── .env                   # Variáveis de ambiente (PRIVADO)
├── .env.example          # Template de .env
├── venv/                 # Ambiente virtual
└── output/               # Cards gerados
    ├── card_1_*.png
    ├── card_2_*.png
    └── ...
```

## 🔑 API Key

A chave da API está segura no arquivo `.env` (não incluído no git).

Para alterar:
1. Edite `.env`
2. Atualize `GOOGLE_API_KEY=sua_nova_chave`

## ⚠️ Solução de Problemas

### Erro: "GOOGLE_API_KEY não encontrada"
- ✅ Certifique-se de que o arquivo `.env` existe
- ✅ Verifique se a chave está preenchida

### Erro: "Modelo não encontrado"
- ✅ Verifique a lista de modelos disponíveis
- ✅ Atualize para um modelo válido em `main.py`

### Cards não estão sendo salvos
- ✅ Verifique permissões da pasta `output/`
- ✅ Certifique-se de que a pasta `output/` existe

## 📞 Suporte

Para dúvidas ou melhorias, consulte a documentação:
- Google AI Studio: https://ai.google.dev/
- PIL/Pillow: https://python-pillow.org/
- Python: https://python.org/

---

**Criado em:** 11 de Novembro de 2025
**Versão:** 1.0.0
**Linguagem:** Python 3.10+
