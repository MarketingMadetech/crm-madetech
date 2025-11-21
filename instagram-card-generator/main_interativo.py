from image_generator import InstagramCardGenerator
import os

def menu():
    print("\n" + "="*60)
    print("🎨 GERADOR DE CARDS INSTAGRAM COM IA - GOOGLE AI STUDIO")
    print("="*60)
    print("\n1️⃣  Gerar 1 card personalizado")
    print("2️⃣  Gerar múltiplos cards em lote")
    print("3️⃣  Ver cards gerados")
    print("4️⃣  Sair")
    print("\n" + "="*60)
    return input("👉 Escolha uma opção (1-4): ")

def gerar_um_card():
    """Gera um único card personalizado"""
    gerador = InstagramCardGenerator()
    tema = input("\n📌 Digite o tema do card (ex: Marketing Digital): ").strip()
    
    if tema:
        try:
            caminho = gerador.gerar_card_completo(tema)
            print(f"\n✅ Card criado com sucesso!")
            print(f"📁 Local: {caminho}")
            print(f"📐 Dimensões: 1080x1920px (Instagram Story)")
        except Exception as e:
            print(f"❌ Erro ao gerar card: {e}")
    else:
        print("❌ Tema inválido!")

def gerar_lote():
    """Gera múltiplos cards em lote"""
    gerador = InstagramCardGenerator()
    temas_input = input("\n📌 Digite os temas separados por vírgula:\n   (ex: Marketing, E-commerce, Social Media): ").strip()
    
    if temas_input:
        temas = [t.strip() for t in temas_input.split(",")]
        print(f"\n⏳ Gerando {len(temas)} cards...")
        
        cards_gerados = 0
        for i, tema in enumerate(temas, 1):
            try:
                print(f"\n[{i}/{len(temas)}] Processando: {tema}")
                gerador.gerar_card_completo(tema)
                cards_gerados += 1
            except Exception as e:
                print(f"❌ Erro ao gerar card '{tema}': {e}")
        
        print(f"\n✅ {cards_gerados}/{len(temas)} cards gerados com sucesso!")
    else:
        print("❌ Nenhum tema informado!")

def ver_cards():
    """Mostra os cards gerados"""
    output_dir = "output"
    if not os.path.exists(output_dir):
        print("❌ Pasta output não encontrada!")
        return
    
    arquivos = sorted([f for f in os.listdir(output_dir) if f.endswith('.png')], reverse=True)
    
    if not arquivos:
        print("❌ Nenhum card gerado ainda!")
        return
    
    print(f"\n📁 Cards gerados ({len(arquivos)}):\n")
    for i, arquivo in enumerate(arquivos, 1):
        filepath = os.path.join(output_dir, arquivo)
        tamanho = os.path.getsize(filepath) / 1024  # KB
        print(f"{i:2d}. {arquivo:50s} ({tamanho:6.1f} KB)")
    
    print(f"\n📂 Localização: {os.path.abspath(output_dir)}")

def main():
    """Menu principal"""
    while True:
        try:
            opcao = menu()
            
            if opcao == "1":
                gerar_um_card()
            elif opcao == "2":
                gerar_lote()
            elif opcao == "3":
                ver_cards()
            elif opcao == "4":
                print("\n👋 Obrigado por usar o gerador de cards! Até logo!\n")
                break
            else:
                print("❌ Opção inválida! Digite entre 1 e 4.")
        except KeyboardInterrupt:
            print("\n\n👋 Programa interrompido!")
            break
        except Exception as e:
            print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main()
