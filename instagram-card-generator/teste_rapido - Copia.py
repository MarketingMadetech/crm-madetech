#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
⚡ TESTE RÁPIDO - Gera um card em segundos
"""

from image_generator import InstagramCardGenerator

print("\n" + "="*60)
print("⚡ TESTE RÁPIDO - GERADOR DE CARDS INSTAGRAM")
print("="*60)

gerador = InstagramCardGenerator()

# Teste 1
print("\n[1/3] Gerando card: Marketing Digital")
gerador.gerar_card_completo("Marketing Digital")

# Teste 2
print("\n[2/3] Gerando card: E-commerce")
gerador.gerar_card_completo("E-commerce")

# Teste 3
print("\n[3/3] Gerando card: Social Media")
gerador.gerar_card_completo("Social Media")

print("\n" + "="*60)
print("✅ 3 CARDS GERADOS COM SUCESSO!")
print("📁 Verifique a pasta 'output/'")
print("="*60 + "\n")
