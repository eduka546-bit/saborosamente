import json

data_map = {
    "São Bento do Sul": [
        {"neighborhood": "Centro", "rate": 8.90}, {"neighborhood": "Progresso", "rate": 8.90},
        {"neighborhood": "25 de Julho", "rate": 10.50}, {"neighborhood": "Alpino", "rate": 17.00},
        {"neighborhood": "Boehmerwald", "rate": 10.50}, {"neighborhood": "Brasília", "rate": 12.00},
        {"neighborhood": "Centenário", "rate": 10.50}, {"neighborhood": "Colonial", "rate": 10.50},
        {"neighborhood": "Cruzeiro", "rate": 10.50}, {"neighborhood": "Industrial Sudoeste", "rate": 11.00},
        {"neighborhood": "Loteamento Itália", "rate": 9.50}, {"neighborhood": "Mato Preto", "rate": 12.00},
        {"neighborhood": "Oxford", "rate": 11.00}, {"neighborhood": "Parque Mariani", "rate": 9.50},
        {"neighborhood": "Residencial Santa Fé", "rate": 12.50}, {"neighborhood": "Rio Negro", "rate": 10.00},
        {"neighborhood": "Schramm", "rate": 9.00}, {"neighborhood": "Serra Alta", "rate": 13.00},
        {"neighborhood": "Dona Francisca", "rate": 15.00}, {"neighborhood": "Bela Aliança", "rate": 10.00},
        {"neighborhood": "Campo do Meio", "rate": 10.00}, {"neighborhood": "Castelo Branco", "rate": 10.00},
        {"neighborhood": "Estrada das Neves", "rate": 10.00}, {"neighborhood": "Estrada dos Bugres", "rate": 10.00},
        {"neighborhood": "Lençol", "rate": 10.00}, {"neighborhood": "Rio Natal", "rate": 10.00},
        {"neighborhood": "Rio Represo", "rate": 10.00}, {"neighborhood": "Rio Vermelho Estação", "rate": 10.00},
        {"neighborhood": "Rio Vermelho Povoado", "rate": 10.00}, {"neighborhood": "Sertãozinho", "rate": 10.00},
        {"neighborhood": "Serra Alta I", "rate": 13.00}, {"neighborhood": "Serra Alta II", "rate": 13.00},
        {"neighborhood": "Rio Vermelho", "rate": 12.00}, {"neighborhood": "Oxford I", "rate": 11.00},
        {"neighborhood": "Oxford II", "rate": 11.00}
    ],
    "Rio Negrinho": ["Ceramarte", "Alegre", "Bairro Preto", "Barro Preto", "Bela Vista", "Campo Lençol", "Centro", "Colônia Olsen", "Cruzeiro", "Industrial Norte", "Industrial Sul", "Jardim Hantschel", "Pinheirinho", "Quitandinha", "Rio Casa de Pedra", "Rio Preto", "Rio dos Bugres", "Serro Azul", "São Pedro", "São Rafael", "Vila Nova", "Vista Alegre", "Volta Grande"],
    "Campo Alegre": ["Avenquinha", "Bateias de Baixo", "Bateias de Cima", "Belo Horizonte", "Cascata", "Cascatas", "Centro", "Corredeiras", "Fragosos", "Lajeado", "Mato Limpo", "Pinhais", "Povoado de Fragosos", "Ribeirão do Meio", "Rio Represo", "Rio do Bugre", "Saltinho", "Santo Antônio", "São Miguel", "Vila Novo Mundo"],
    "Corupá": ["Ano Bom", "Bomplandt", "Caminho Pequeno", "Centro", "Faxinal", "Itapocu", "Izabel", "João Tozini", "Pedra de Amolar", "Poço D'Anta", "Putinga", "Rio Correa", "Rio Feio", "Rio Novo", "Rio Paulo", "Rio da Veada", "Seminário", "XV de Novembro"],
    "Mafra": ["Augusta Vitória", "Autódromo", "Avencal São Sebastião", "Avencal de Cima", "Avencal do Meio", "Bairro do Autódromo", "Bela Vista do Sul", "Bituvinha", "Butiá dos Tabordas", "Campina Konkel", "Campo da Lança", "Caçador", "Centro I - Baixada", "Centro II - Alto de Mafra", "Centro III Monte Alegre", "Espigão do Bugre", "Faxinal", "Fazenda Potreiro", "General Brito", "Imbuial", "Jardim América", "Jardim Novo Horizonte", "Jardim do Moinho", "Maurício Caillet", "Nossa Senhora Aparecida", "Passo", "Restinga", "Rio Preto", "Rio da Areia", "Rio da Areia de Baixo", "Rio da Areia de Cima", "Rio do Cedro", "Saltinho do Canivete", "São Lourenço", "Vila Argentina", "Vila Buenos Aires", "Vila Clementina", "Vila Edson Luis", "Vila Ferroviária", "Vila Formosa", "Vila Industrial", "Vila Ivete", "Vila Nova", "Vila Ruthes", "Vila Solidariedade", "Vila Velha", "Vila das Flores", "Vilinha", "Vista Alegre"],
    "Piên": ["Aterrado Alto", "Avencal", "Boa Vista", "Cachoeirinha", "Campina dos Crespins", "Campina dos Maia", "Campo Novo", "Centro", "Cerro Verde", "Gramados", "Lageado", "Letreiro", "Mosquito", "Palmito", "Palmito de Cima", "Picacinho", "Pocinho", "Poço Frio", "Poço Frio dos Moreiras", "Quicé", "Trigolândia", "Vermelhinho"],
    "Rio Negro": ["Bairro Alto", "Bairro do Seminário", "Bom Jesus", "Bom Jesus do Rio Negro", "Campina dos Andrades", "Campo do Gado", "Centro", "Estação Nova", "Fazendinha", "Jardim Zelinda", "Lageado dos Vieiras", "Maitaca", "Passa Três", "Passo do Valo", "Retiro", "Roseira", "Seminário", "Sítio dos Rauen", "Tijuco Preto", "Vila Militar", "Vila Paraná", "Vila Paraíso", "Volta Grande"]
}

values = []
for city, neighborhoods in data_map.items():
    for n in neighborhoods:
        name = n["neighborhood"] if isinstance(n, dict) else n
        rate = n["rate"] if isinstance(n, dict) else 10.00
        values.append(f"('{city}', '{name.replace(\"'\", \"''\")}', {rate})")

sql = f"INSERT INTO public.delivery_rates (city, neighborhood, rate) VALUES\n" + ",\n".join(values) + "\nON CONFLICT (city, neighborhood) DO UPDATE SET rate = EXCLUDED.rate;"
print(sql)
