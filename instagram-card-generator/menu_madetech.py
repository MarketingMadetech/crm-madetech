#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
🎨 MENU INTERATIVO - GERADOR DE CARDS MADETECH
Com identidade visual do site Madetech
"""

from madetech_cards import MadetechCardGenerator
import os

def menu_principal():
    print("\n" + "="*70)
    print("🎨 GERADOR DE CARDS INSTAGRAM - IDENTIDADE VISUAL MADETECH")
    print("="*70)
    print("\n1️⃣  Gerar card personalizado (com tema próprio)")
    print("2️⃣  Gerar cards Madetech pré-definidos")
    print("3️⃣  Gerar cards em lote")
    print("4️⃣  Ver relatório de identidade visual")
    print("5️⃣  Ver cards gerados")
    print("6️⃣  Sair")
    print("\n" + "="*70)
    return input("👉 Escolha uma opção (1-6): ").strip()

def gerar_card_personalizado():
    """Opção 1: Card personalizado"""
    print("\n" + "-"*70)
    print("✏️  CRIAR CARD PERSONALIZADO")
    print("-"*70)
    
    gerador = MadetechCardGenerator()
    
    tema = input("\n📌 Digite o tema do card: ").strip()
    
    categorias = ["Geral", "Corte", "Colagem", "Usinagem", "Promoção"]
    print("\n📂 Categorias disponíveis:")
    for i, cat in enumerate(categorias, 1):
        print(f"   {i}. {cat}")
    
    escolha_cat = input("\nEscolha a categoria (1-5) [padrão: 1]: ").strip()
    categoria = categorias[int(escolha_cat) - 1] if escolha_cat in ['1', '2', '3', '4', '5'] else "Geral"
    
    if tema:
        try:
            caminho = gerador.gerar_card_madetech(tema, categoria)
            print(f"\n✅ Card criado com sucesso!")
            print(f"📁 Local: {caminho}")
        except Exception as e:
            print(f"❌ Erro: {e}")
    else:
        print("❌ Tema inválido!")

def gerar_cards_predefinidos():
    """Opção 2: Cards Madetech pré-definidos"""
    print("\n" + "-"*70)
    print("📊 CARDS MADETECH PRÉ-DEFINIDOS")
    print("-"*70)
    
    gerador = MadetechCardGenerator()
    
    cards_predefinidos = [
        ("Corte com Precisão", "Corte"),
        ("Colagem Automática", "Colagem"),
        ("Usinagem CNC de Ponta", "Usinagem"),
        ("Tecnologia Alemã", "Geral"),
    ]
    
    print("\n📋 Cards disponíveis:")
    for i, (tema, cat) in enumerate(cards_predefinidos, 1):
        print(f"   {i}. {tema} ({cat})")
    
    for tema, categoria in cards_predefinidos:
        try:
            gerador.gerar_card_madetech(tema, categoria)
        except Exception as e:
            print(f"❌ Erro ao gerar '{tema}': {e}")
    
    print(f"\n✅ {len(cards_predefinidos)} cards gerados com sucesso!")

def gerar_cards_lote():
    """Opção 3: Gerar em lote"""
    print("\n" + "-"*70)
    print("📊 GERADOR EM LOTE")
    print("-"*70)
    
    temas_input = input("\n📌 Digite os temas separados por vírgula:\n   (ex: Corte Preciso, Colagem Rápida): ").strip()
    
    if temas_input:
        temas = [t.strip() for t in temas_input.split(",")]
        
        gerador = MadetechCardGenerator()
        cards_ok = 0
        
        print(f"\n⏳ Gerando {len(temas)} cards Madetech...\n")
        
        for i, tema in enumerate(temas, 1):
            try:
                print(f"[{i}/{len(temas)}] Processando: {tema}")
                gerador.gerar_card_madetech(tema, "Geral")
                cards_ok += 1
            except Exception as e:
                print(f"   ❌ Erro: {e}")
        
        print(f"\n✅ {cards_ok}/{len(temas)} cards gerados com sucesso!")
    else:
        print("❌ Nenhum tema informado!")

def ver_relatorio():
    """Opção 4: Ver relatório de identidade visual"""
    relatorio_path = "RELATORIO_IDENTIDADE_VISUAL.md"
    
    if os.path.exists(relatorio_path):
        print("\n" + "="*70)
        print("📊 RELATÓRIO DE IDENTIDADE VISUAL MADETECH")
        print("="*70)
        print("\n✅ Relatório disponível: RELATORIO_IDENTIDADE_VISUAL.md")
        print("\nResumo das cores Madetech:")
        print("  🔵 Azul Primário: #0066cc")
        print("  🔷 Azul Escuro: #003d99")
        print("  ⚪ Branco: #ffffff")
        print("  ✨ Ouro: #FFD700")
        print("\nFonte: Inter (300-800)")
        print("\nEstilo: Moderno, Profissional, B2B")
        print("\nCardos com:")
        print("  ✓ Gradiente azul profissional")
        print("  ✓ Elementos dourados")
        print("  ✓ Tipografia clara")
        print("  ✓ CTAs destacadas")
        print("  ✓ Efeito sombra")
    else:
        print("❌ Relatório não encontrado!")

def ver_cards():
    """Opção 5: Ver cards gerados"""
    output_dir = "output"
    
    if not os.path.exists(output_dir):
        print("❌ Pasta output não encontrada!")
        return
    
    arquivos = sorted([f for f in os.listdir(output_dir) if f.endswith('.png')], reverse=True)
    
    if not arquivos:
        print("❌ Nenhum card gerado ainda!")
        return
    
    print("\n" + "="*70)
    print(f"📁 CARDS GERADOS ({len(arquivos)})")
    print("="*70 + "\n")
    
    # Separa Madetech dos outros
    madetech_cards = [f for f in arquivos if 'madetech' in f]
    outros_cards = [f for f in arquivos if 'madetech' not in f]
    
    if madetech_cards:
        print("🎨 CARDS MADETECH (com identidade visual):\n")
        for i, arquivo in enumerate(madetech_cards, 1):
            filepath = os.path.join(output_dir, arquivo)
            tamanho = os.path.getsize(filepath) / 1024
            print(f"{i:2d}. {arquivo:55s} ({tamanho:6.1f} KB)")
    
    if outros_cards:
        print("\n📊 OUTROS CARDS:\n")
        for i, arquivo in enumerate(outros_cards, 1):
            filepath = os.path.join(output_dir, arquivo)
            tamanho = os.path.getsize(filepath) / 1024
            print(f"{i:2d}. {arquivo:55s} ({tamanho:6.1f} KB)")
    
    print(f"\n📂 Localização: {os.path.abspath(output_dir)}")

def main():
    """Menu principal"""
    while True:
        try:
            opcao = menu_principal()
            
            if opcao == "1":
                gerar_card_personalizado()
            elif opcao == "2":
                gerar_cards_predefinidos()
            elif opcao == "3":
                gerar_cards_lote()
            elif opcao == "4":
                ver_relatorio()
            elif opcao == "5":
                ver_cards()
            elif opcao == "6":
                print("\n👋 Obrigado por usar o Gerador Madetech! Até logo!\n")
                break
            else:
                print("❌ Opção inválida!")
                
        except KeyboardInterrupt:
            print("\n\n👋 Programa interrompido!")
            break
        except Exception as e:
            print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main()
