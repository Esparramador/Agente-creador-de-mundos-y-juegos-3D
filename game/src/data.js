// GENERADO por tools/build_design.py — no editar.
export const CHAMPIONS = [{"id": "brannoc", "name": "Brannoc", "title": "El Yunque Viviente", "race": "Enano", "faction": "Clanes de Hondaforja", "role": "Top / Soporte", "damage": "Físico", "resource": "Maná", "difficulty": 1, "lore": "Herrero-guardián que se fundió a sí mismo con su yunque para cerrar la Puerta de Hondaforja.", "passive": {"name": "Piel de Yunque", "desc": "Cada 8 s gana un escudo del 8% de vida máx. que se refresca si no recibe daño en 4 s."}, "abilities": [{"key": "Q", "name": "Martillazo Sísmico", "type": "Línea", "desc": "Golpea el suelo; daña y ralentiza un 40% 1,5 s.", "cooldown": [9, 8.5, 8, 7.5, 7], "cost": 50, "base": [70, 110, 150, 190, 230], "ratio": {"ad": 0.6}, "range": 600}, {"key": "W", "name": "Templar Acero", "type": "Autobuff", "desc": "+20/25/30/35/40 armadura y RM durante 4 s; refleja 15 de daño por golpe.", "cooldown": [14, 13, 12, 11, 10], "cost": 60, "base": [15, 15, 15, 15, 15], "ratio": {"armor": 0.1}, "range": 0}, {"key": "E", "name": "Carga de Forja", "type": "Embestida", "desc": "Embiste hacia delante y empuja al primer enemigo 250 u.", "cooldown": [14, 13, 12, 11, 10], "cost": 70, "base": [60, 95, 130, 165, 200], "ratio": {"hp_bonus": 0.04}, "range": 450}, {"key": "R", "name": "Ruptura de la Montaña", "type": "Área", "desc": "Tras 0,75 s levanta 3 pilares en un área: derriba 1,25 s y bloquea el paso 3 s.", "cooldown": [130, 115, 100], "cost": 100, "base": [150, 250, 350], "ratio": {"ap": 0.6}, "range": 700}], "base_stats": {"hp": 690, "hp_g": 110, "armor": 38, "armor_g": 4.7, "mr": 32, "mr_g": 2.0, "ad": 62, "ad_g": 3.5, "ms": 335, "range": 125, "attack_speed": 0.625, "attack_speed_growth_pct": 1.5}, "level18": {"hp": 2560.0, "ad": 121.5, "armor": 117.9, "mr": 66.0}, "class": "Tanque"}, {"id": "morgra", "name": "Morgra", "title": "Madre de la Horda", "race": "Orco", "faction": "Horda de Colmillo Rojo", "role": "Jungla", "damage": "Mágico", "resource": "Furia", "difficulty": 2, "lore": "Chamana de guerra que lleva en el pecho el tótem de sus antepasados.", "passive": {"name": "Sangre Ancestral", "desc": "Por debajo del 40% de vida gana 30% de tenacidad y 2% de vida máx. por segundo durante 3 s (CD 60 s)."}, "abilities": [{"key": "Q", "name": "Tótem de Rugido", "type": "Área", "desc": "Planta un tótem que provoca a los enemigos cercanos durante 1 s.", "cooldown": [12, 11, 10, 9, 8], "cost": 0, "base": [60, 90, 120, 150, 180], "ratio": {"ap": 0.5}, "range": 350}, {"key": "W", "name": "Piel Tatuada", "type": "Autobuff", "desc": "Reduce el daño recibido 15/18/21/24/27% durante 3 s.", "cooldown": [16, 15, 14, 13, 12], "cost": 0, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 0}, {"key": "E", "name": "Garra del Jabalí", "type": "Objetivo", "desc": "Golpe que inflige daño y gana 30% vel. movimiento hacia campeones.", "cooldown": [8, 7.5, 7, 6.5, 6], "cost": 0, "base": [50, 80, 110, 140, 170], "ratio": {"hp_bonus": 0.05}, "range": 200}, {"key": "R", "name": "Estampida de la Horda", "type": "Embestida", "desc": "Invoca espíritus de jabalí que cargan en línea, lanzan por los aires 1 s y la acompañan.", "cooldown": [120, 105, 90], "cost": 0, "base": [200, 300, 400], "ratio": {"ap": 0.8}, "range": 1000}], "base_stats": {"hp": 670, "hp_g": 110, "armor": 36, "armor_g": 4.7, "mr": 32, "mr_g": 2.0, "ad": 65, "ad_g": 3.5, "ms": 335, "range": 125, "attack_speed": 0.625, "attack_speed_growth_pct": 1.5}, "level18": {"hp": 2540.0, "ad": 124.5, "armor": 115.9, "mr": 66.0}, "class": "Tanque"}, {"id": "ossuar", "name": "Ossuar", "title": "Osario Errante", "race": "No-muerto", "faction": "Reino Velado", "role": "Soporte", "damage": "Mágico", "resource": "Maná", "difficulty": 2, "lore": "Gólem de huesos de mil guerreros caídos que busca descanso para cada uno de ellos.", "passive": {"name": "Cosecha Ósea", "desc": "Cuando muere una unidad enemiga cercana obtiene 1 hueso (máx. 30): +1 armadura y RM por hueso."}, "abilities": [{"key": "Q", "name": "Garfio de Costillas", "type": "Proyectil", "desc": "Lanza una costilla que atrae al primer enemigo hacia Ossuar.", "cooldown": [18, 16, 14, 12, 10], "cost": 80, "base": [80, 130, 180, 230, 280], "ratio": {"ap": 0.5}, "range": 1000}, {"key": "W", "name": "Coraza de Hueso", "type": "Escudo aliado", "desc": "Escuda a un aliado por 60/90/120/150/180 (+10% vida bonus).", "cooldown": [14, 13, 12, 11, 10], "cost": 60, "base": [60, 90, 120, 150, 180], "ratio": {"hp_bonus": 0.1}, "range": 600}, {"key": "E", "name": "Tumba Abierta", "type": "Área", "desc": "Crea un área que inmoviliza 1 s tras 0,5 s de retraso.", "cooldown": [14, 13, 12, 11, 10], "cost": 70, "base": [50, 85, 120, 155, 190], "ratio": {"ap": 0.4}, "range": 650}, {"key": "R", "name": "Cripta Sellada", "type": "Área", "desc": "Encierra un área de 400 u. durante 2,5 s: nadie entra ni sale.", "cooldown": [140, 120, 100], "cost": 100, "base": [0, 0, 0], "ratio": {}, "range": 700}], "base_stats": {"hp": 650, "hp_g": 110, "armor": 36, "armor_g": 4.7, "mr": 36, "mr_g": 2.0, "ad": 62, "ad_g": 3.5, "ms": 335, "range": 125, "attack_speed": 0.625, "attack_speed_growth_pct": 1.5}, "level18": {"hp": 2520.0, "ad": 121.5, "armor": 115.9, "mr": 70.0}, "class": "Tanque"}, {"id": "kaelith", "name": "Kaelith", "title": "Filo del Alba", "race": "Humano", "faction": "Orden del Sol Partido", "role": "Top", "damage": "Físico", "resource": "Maná", "difficulty": 2, "lore": "Paladina expulsada de su orden por negarse a quemar una aldea; ahora juzga con su propia espada.", "passive": {"name": "Juramento Roto", "desc": "Cada 3er ataque inflige 4% de vida máx. del objetivo como daño verdadero."}, "abilities": [{"key": "Q", "name": "Corte Solar", "type": "Línea", "desc": "Tajo frontal; si golpea a un campeón, se puede relanzar una vez.", "cooldown": [8, 7.5, 7, 6.5, 6], "cost": 40, "base": [40, 70, 100, 130, 160], "ratio": {"ad": 0.75}, "range": 300}, {"key": "W", "name": "Égida", "type": "Autobuff", "desc": "Bloquea el siguiente hechizo o ataque básico de campeón (1,5 s).", "cooldown": [18, 16, 14, 12, 10], "cost": 60, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 0}, {"key": "E", "name": "Paso del Juicio", "type": "Desplazamiento", "desc": "Avanza 350 u.; el siguiente ataque aturde 0,75 s.", "cooldown": [13, 12, 11, 10, 9], "cost": 50, "base": [50, 75, 100, 125, 150], "ratio": {"ad": 0.5}, "range": 350}, {"key": "R", "name": "Sentencia del Alba", "type": "Objetivo", "desc": "Salta sobre un campeón; daño aumentado en un 1% por cada 1% de vida que le falte.", "cooldown": [100, 85, 70], "cost": 100, "base": [150, 275, 400], "ratio": {"ad_bonus": 1.0}, "range": 600}], "base_stats": {"hp": 620, "hp_g": 100, "armor": 34, "armor_g": 4.2, "mr": 32, "mr_g": 2.0, "ad": 66, "ad_g": 3.8, "ms": 345, "range": 150, "attack_speed": 0.65, "attack_speed_growth_pct": 2.5}, "level18": {"hp": 2320.0, "ad": 130.6, "armor": 105.4, "mr": 66.0}, "class": "Luchador"}, {"id": "tharok", "name": "Tharok", "title": "Hacha del Norte", "race": "Orco", "faction": "Horda de Colmillo Rojo", "role": "Jungla", "damage": "Físico", "resource": "Furia", "difficulty": 1, "lore": "El campeón de arena más temido de la Horda. Nunca ha perdido un combate a hachazos.", "passive": {"name": "Frenesí", "desc": "Cada ataque da 8% de vel. ataque durante 4 s (acumula 5 veces)."}, "abilities": [{"key": "Q", "name": "Torbellino", "type": "Área", "desc": "Gira durante 1,5 s dañando a su alrededor; se cura un 30% del daño a campeones.", "cooldown": [10, 9, 8, 7, 6], "cost": 0, "base": [90, 140, 190, 240, 290], "ratio": {"ad": 1.0}, "range": 250}, {"key": "W", "name": "Grito de Guerra", "type": "Área", "desc": "Reduce el daño de los enemigos cercanos un 20% durante 3 s.", "cooldown": [16, 15, 14, 13, 12], "cost": 0, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 400}, {"key": "E", "name": "Salto Brutal", "type": "Desplazamiento", "desc": "Salta a una zona y ralentiza un 50% 1 s.", "cooldown": [14, 13, 12, 11, 10], "cost": 0, "base": [60, 95, 130, 165, 200], "ratio": {"ad_bonus": 0.6}, "range": 600}, {"key": "R", "name": "Ira Indomable", "type": "Autobuff", "desc": "Durante 5 s su vida no baja de 1.", "cooldown": [110, 95, 80], "cost": 0, "base": [0, 0, 0], "ratio": {}, "range": 0}], "base_stats": {"hp": 650, "hp_g": 100, "armor": 34, "armor_g": 4.2, "mr": 32, "mr_g": 2.0, "ad": 66, "ad_g": 3.8, "ms": 345, "range": 150, "attack_speed": 0.65, "attack_speed_growth_pct": 2.5}, "level18": {"hp": 2350.0, "ad": 130.6, "armor": 105.4, "mr": 66.0}, "class": "Luchador"}, {"id": "yssra", "name": "Yssra", "title": "Reina de las Mareas", "race": "Sirénida", "faction": "Abismo de Coral", "role": "Mid / Top", "damage": "Mixto", "resource": "Maná", "difficulty": 3, "lore": "Heredera del trono sumergido, sube a la superficie para reclamar las costas robadas.", "passive": {"name": "Corriente", "desc": "Las habilidades dejan un charco 3 s; dentro, Yssra gana 20% vel. movimiento y 10 de regeneración."}, "abilities": [{"key": "Q", "name": "Tridente", "type": "Línea", "desc": "Estocada de 2 golpes: el 1º físico, el 2º mágico.", "cooldown": [7, 6.5, 6, 5.5, 5], "cost": 45, "base": [45, 70, 95, 120, 145], "ratio": {"ad": 0.5, "ap": 0.5}, "range": 475}, {"key": "W", "name": "Burbuja", "type": "Escudo", "desc": "Escudo de 70-230 que ralentiza a los atacantes un 30%.", "cooldown": [15, 14, 13, 12, 11], "cost": 70, "base": [70, 110, 150, 190, 230], "ratio": {"ap": 0.4}, "range": 0}, {"key": "E", "name": "Ola Rompiente", "type": "Desplazamiento", "desc": "Surfea 500 u. y lanza por los aires 0,5 s a los enemigos que atraviesa.", "cooldown": [16, 15, 14, 13, 12], "cost": 60, "base": [60, 90, 120, 150, 180], "ratio": {"ap": 0.6}, "range": 500}, {"key": "R", "name": "Maremoto", "type": "Área", "desc": "Inunda un área enorme: daña, ralentiza un 60% y toda el área cuenta como charco.", "cooldown": [120, 110, 100], "cost": 100, "base": [200, 325, 450], "ratio": {"ap": 0.75, "ad_bonus": 0.5}, "range": 900}], "base_stats": {"hp": 620, "hp_g": 100, "armor": 34, "armor_g": 4.2, "mr": 32, "mr_g": 2.0, "ad": 66, "ad_g": 3.8, "ms": 350, "range": 150, "attack_speed": 0.65, "attack_speed_growth_pct": 2.5}, "level18": {"hp": 2320.0, "ad": 130.6, "armor": 105.4, "mr": 66.0}, "class": "Luchador"}, {"id": "vaelor", "name": "Vaelor", "title": "Archimago de Ceniza", "race": "Elfo de Ceniza", "faction": "Concilio de la Torre Gris", "role": "Mid", "damage": "Mágico", "resource": "Maná", "difficulty": 2, "lore": "Último superviviente de la ciudad élfica que él mismo calcinó al perder el control de su magia.", "passive": {"name": "Rescoldo", "desc": "Las habilidades queman al objetivo un 2% de su vida máx. durante 3 s."}, "abilities": [{"key": "Q", "name": "Lanza Ígnea", "type": "Proyectil", "desc": "Proyectil que daña al primer enemigo y explota en un área pequeña.", "cooldown": [6, 5.5, 5, 4.5, 4], "cost": 55, "base": [80, 120, 160, 200, 240], "ratio": {"ap": 0.7}, "range": 900}, {"key": "W", "name": "Muro de Ceniza", "type": "Muro", "desc": "Crea un muro de fuego de 600 u. durante 3 s; ralentiza un 40%.", "cooldown": [18, 17, 16, 15, 14], "cost": 80, "base": [60, 95, 130, 165, 200], "ratio": {"ap": 0.4}, "range": 800}, {"key": "E", "name": "Combustión", "type": "Objetivo", "desc": "Detona las quemaduras del objetivo; si estaba quemándose, aturde 1,25 s.", "cooldown": [12, 11, 10, 9, 8], "cost": 70, "base": [70, 105, 140, 175, 210], "ratio": {"ap": 0.6}, "range": 650}, {"key": "R", "name": "Lluvia de Meteoros", "type": "Área", "desc": "Canaliza 2 s: cae un meteoro cada 0,4 s en el área.", "cooldown": [110, 95, 80], "cost": 100, "base": [300, 450, 600], "ratio": {"ap": 1.2}, "range": 1300}], "base_stats": {"hp": 560, "hp_g": 92, "armor": 22, "armor_g": 4.2, "mr": 30, "mr_g": 1.3, "ad": 52, "ad_g": 3.0, "ms": 330, "range": 525, "attack_speed": 0.625, "attack_speed_growth_pct": 1.8}, "level18": {"hp": 2124.0, "ad": 103.0, "armor": 93.4, "mr": 52.1}, "class": "Mago"}, {"id": "nyxe", "name": "Nyxe", "title": "Tejesueños", "race": "Feérico", "faction": "Bosque Onírico", "role": "Mid / Soporte", "damage": "Mágico", "resource": "Maná", "difficulty": 3, "lore": "Hada que roba pesadillas a los niños... y a veces se las devuelve a los adultos.", "passive": {"name": "Polvo de Hada", "desc": "Cada 4ª habilidad lanzada es gratuita y gana 50 de alcance."}, "abilities": [{"key": "Q", "name": "Mariposas Oníricas", "type": "Proyectil", "desc": "Lanza 3 mariposas que persiguen al enemigo más cercano.", "cooldown": [7, 6.5, 6, 5.5, 5], "cost": 60, "base": [30, 45, 60, 75, 90], "ratio": {"ap": 0.3}, "range": 700}, {"key": "W", "name": "Somnolencia", "type": "Área", "desc": "Tras 1,5 s duerme 1,5 s a los enemigos del área (el daño despierta).", "cooldown": [16, 15, 14, 13, 12], "cost": 80, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 800}, {"key": "E", "name": "Paso Fae", "type": "Desplazamiento", "desc": "Parpadea 400 u. y se vuelve invisible 1 s.", "cooldown": [18, 16, 14, 12, 10], "cost": 60, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 400}, {"key": "R", "name": "Pesadilla Compartida", "type": "Objetivo", "desc": "Encierra a un campeón 2 s en un sueño: no ve a nadie; al salir sufre daño.", "cooldown": [120, 100, 80], "cost": 100, "base": [200, 300, 400], "ratio": {"ap": 0.8}, "range": 700}], "base_stats": {"hp": 560, "hp_g": 92, "armor": 22, "armor_g": 4.2, "mr": 30, "mr_g": 1.3, "ad": 52, "ad_g": 3.0, "ms": 335, "range": 525, "attack_speed": 0.625, "attack_speed_growth_pct": 1.8}, "level18": {"hp": 2124.0, "ad": 103.0, "armor": 93.4, "mr": 52.1}, "class": "Mago"}, {"id": "zerath", "name": "Zerath", "title": "El Hambre Profunda", "race": "Espíritu del Vacío", "faction": "La Grieta", "role": "Mid / Top", "damage": "Mágico", "resource": "Ninguno (vida)", "difficulty": 3, "lore": "Fragmento consciente del vacío que aprendió a imitar la forma humana devorando recuerdos.", "passive": {"name": "Devorar", "desc": "Las habilidades cuestan 5% de vida actual; cada asesinato o asistencia da +5 PH permanente."}, "abilities": [{"key": "Q", "name": "Mano del Vacío", "type": "Área", "desc": "Tras 0,5 s, garras emergen del suelo y ralentizan un 60%.", "cooldown": [8, 7.5, 7, 6.5, 6], "cost": 0, "base": [70, 110, 150, 190, 230], "ratio": {"ap": 0.6}, "range": 800}, {"key": "W", "name": "Absorber", "type": "Drenaje", "desc": "Canaliza 3 s sobre un objetivo: daño por segundo y se cura el 60%.", "cooldown": [14, 13, 12, 11, 10], "cost": 0, "base": [40, 60, 80, 100, 120], "ratio": {"ap": 0.25}, "range": 500}, {"key": "E", "name": "Fase", "type": "Autobuff", "desc": "Se vuelve inalcanzable 1 s.", "cooldown": [22, 20, 18, 16, 14], "cost": 0, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 0}, {"key": "R", "name": "Singularidad", "type": "Área", "desc": "Crea un agujero negro de 2,5 s que atrae continuamente al centro.", "cooldown": [130, 115, 100], "cost": 0, "base": [250, 375, 500], "ratio": {"ap": 0.9}, "range": 750}], "base_stats": {"hp": 620, "hp_g": 92, "armor": 22, "armor_g": 4.2, "mr": 32, "mr_g": 1.3, "ad": 52, "ad_g": 3.0, "ms": 330, "range": 525, "attack_speed": 0.625, "attack_speed_growth_pct": 1.8}, "level18": {"hp": 2184.0, "ad": 103.0, "armor": 93.4, "mr": 54.1}, "class": "Mago"}, {"id": "lyra", "name": "Lyra Vientoalto", "title": "Flecha del Cielo", "race": "Elfo Silvano", "faction": "Bosque Onírico", "role": "Carril inferior (tirador)", "damage": "Físico", "resource": "Maná", "difficulty": 1, "lore": "Exploradora élfica capaz de acertar a un halcón en vuelo a un kilómetro de distancia.", "passive": {"name": "Ojo de Halcón", "desc": "Atacar al mismo objetivo 3 veces seguidas da 30% de vel. ataque durante 3 s."}, "abilities": [{"key": "Q", "name": "Flecha Perforante", "type": "Línea", "desc": "Disparo cargado que atraviesa a todos los enemigos (-10% daño por objetivo).", "cooldown": [9, 8, 7, 6, 5], "cost": 50, "base": [40, 75, 110, 145, 180], "ratio": {"ad": 1.1}, "range": 1100}, {"key": "W", "name": "Lluvia de Flechas", "type": "Área", "desc": "Ralentiza un 30% y daña en un área circular.", "cooldown": [14, 13, 12, 11, 10], "cost": 70, "base": [60, 95, 130, 165, 200], "ratio": {"ad_bonus": 0.6}, "range": 900}, {"key": "E", "name": "Voltereta", "type": "Desplazamiento", "desc": "Rueda 300 u.; el siguiente ataque tiene +100 de alcance.", "cooldown": [12, 11, 10, 9, 8], "cost": 40, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 300}, {"key": "R", "name": "Saeta Celeste", "type": "Proyectil global", "desc": "Flecha que cruza el mapa; aturde según la distancia (1-3,5 s).", "cooldown": [100, 90, 80], "cost": 100, "base": [200, 325, 450], "ratio": {"ap": 1.0}, "range": 99999}], "base_stats": {"hp": 580, "hp_g": 96, "armor": 26, "armor_g": 4.2, "mr": 30, "mr_g": 1.3, "ad": 60, "ad_g": 2.6, "ms": 330, "range": 600, "attack_speed": 0.658, "attack_speed_growth_pct": 3.2}, "level18": {"hp": 2212.0, "ad": 104.2, "armor": 97.4, "mr": 52.1}, "class": "Tirador"}, {"id": "gearix", "name": "Gearix", "title": "Ingeniera Loca", "race": "Gnomo", "faction": "Consorcio de Engranajes", "role": "Carril inferior (tirador)", "damage": "Físico", "resource": "Munición (6 balas)", "difficulty": 2, "lore": "Genio expulsada de cuatro academias por 'exceso de explosiones'. Le parece una crítica injusta.", "passive": {"name": "Cargador", "desc": "Cada 6º ataque es un disparo de escopeta en cono con 150% de daño."}, "abilities": [{"key": "Q", "name": "Torreta Portátil", "type": "Invocación", "desc": "Despliega una torreta (máx. 2) que ataca 8 s.", "cooldown": [12, 11, 10, 9, 8], "cost": 0, "base": [20, 30, 40, 50, 60], "ratio": {"ad": 0.3}, "range": 500}, {"key": "W", "name": "Granada de Humo", "type": "Área", "desc": "Ciega a los enemigos del área 1,5 s (sus ataques fallan).", "cooldown": [16, 15, 14, 13, 12], "cost": 0, "base": [50, 80, 110, 140, 170], "ratio": {"ap": 0.5}, "range": 700}, {"key": "E", "name": "Retroceso", "type": "Desplazamiento", "desc": "Dispara hacia delante y sale despedida 400 u. hacia atrás.", "cooldown": [16, 14, 12, 10, 8], "cost": 0, "base": [40, 70, 100, 130, 160], "ratio": {"ad_bonus": 0.5}, "range": 400}, {"key": "R", "name": "Gran Cañón", "type": "Línea", "desc": "Tras 1 s de carga, rayo que daña un 50% más a objetivos con poca vida.", "cooldown": [90, 75, 60], "cost": 0, "base": [250, 400, 550], "ratio": {"ad_bonus": 1.5}, "range": 1500}], "base_stats": {"hp": 580, "hp_g": 96, "armor": 26, "armor_g": 4.2, "mr": 30, "mr_g": 1.3, "ad": 62, "ad_g": 2.6, "ms": 330, "range": 575, "attack_speed": 0.658, "attack_speed_growth_pct": 3.2}, "level18": {"hp": 2212.0, "ad": 106.2, "armor": 97.4, "mr": 52.1}, "class": "Tirador"}, {"id": "sable", "name": "Sable", "title": "La Sombra sin Nombre", "race": "Humano", "faction": "Hermandad del Velo", "role": "Mid / Jungla", "damage": "Físico", "resource": "Energía", "difficulty": 3, "lore": "Nadie conoce su verdadero nombre, ni siquiera la Hermandad que la entrenó.", "passive": {"name": "Marca Mortal", "desc": "Golpear a un campeón aislado (sin aliados en 600 u.) inflige un 25% de daño extra."}, "abilities": [{"key": "Q", "name": "Daga Sombría", "type": "Proyectil", "desc": "Lanza una daga; si impacta, puede teletransportarse detrás del objetivo.", "cooldown": [8, 7.5, 7, 6.5, 6], "cost": 50, "base": [60, 95, 130, 165, 200], "ratio": {"ad_bonus": 0.8}, "range": 700}, {"key": "W", "name": "Velo", "type": "Sigilo", "desc": "Invisible 2 s y +20% vel. movimiento.", "cooldown": [20, 18, 16, 14, 12], "cost": 60, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 0}, {"key": "E", "name": "Abanico de Cuchillas", "type": "Área", "desc": "Cuchillas a su alrededor; ralentizan un 30%.", "cooldown": [6, 5.5, 5, 4.5, 4], "cost": 40, "base": [50, 75, 100, 125, 150], "ratio": {"ad_bonus": 0.6}, "range": 300}, {"key": "R", "name": "Ejecución", "type": "Objetivo", "desc": "Marca a un campeón; tras 3 s la marca explota con el 30% del daño infligido.", "cooldown": [90, 75, 60], "cost": 0, "base": [100, 175, 250], "ratio": {"ad_bonus": 1.0}, "range": 625}], "base_stats": {"hp": 590, "hp_g": 98, "armor": 30, "armor_g": 4.5, "mr": 32, "mr_g": 2.0, "ad": 64, "ad_g": 3.3, "ms": 350, "range": 125, "attack_speed": 0.668, "attack_speed_growth_pct": 2.2}, "level18": {"hp": 2256.0, "ad": 120.1, "armor": 106.5, "mr": 66.0}, "class": "Asesino"}, {"id": "rakhar", "name": "Rakhar", "title": "Garra Escarlata", "race": "Bestial (felino)", "faction": "Tribus de las Dunas", "role": "Jungla", "damage": "Físico", "resource": "Ninguno", "difficulty": 2, "lore": "Cazador del desierto que prefiere presas que puedan defenderse.", "passive": {"name": "Instinto de Caza", "desc": "Ve a los campeones enemigos por debajo del 50% de vida a 1500 u. y gana 15% vel. movimiento hacia ellos."}, "abilities": [{"key": "Q", "name": "Zarpazo", "type": "Objetivo", "desc": "3 zarpazos rápidos; el 3º inflige el doble.", "cooldown": [7, 6.5, 6, 5.5, 5], "cost": 0, "base": [30, 45, 60, 75, 90], "ratio": {"ad_bonus": 0.5}, "range": 175}, {"key": "W", "name": "Rugido", "type": "Área", "desc": "Asusta 0,75 s a los enemigos cercanos.", "cooldown": [18, 17, 16, 15, 14], "cost": 0, "base": [40, 65, 90, 115, 140], "ratio": {"ad_bonus": 0.4}, "range": 325}, {"key": "E", "name": "Abalanzarse", "type": "Desplazamiento", "desc": "Salta sobre un objetivo; se reinicia con asesinatos o asistencias.", "cooldown": [12, 11, 10, 9, 8], "cost": 0, "base": [60, 90, 120, 150, 180], "ratio": {"ad_bonus": 0.7}, "range": 650}, {"key": "R", "name": "Cacería", "type": "Autobuff", "desc": "6 s: +40% vel. movimiento, se vuelve invisible fuera de combate y su próximo ataque es crítico.", "cooldown": [100, 85, 70], "cost": 0, "base": [0, 0, 0], "ratio": {}, "range": 0}], "base_stats": {"hp": 590, "hp_g": 98, "armor": 30, "armor_g": 4.5, "mr": 32, "mr_g": 2.0, "ad": 66, "ad_g": 3.3, "ms": 350, "range": 125, "attack_speed": 0.668, "attack_speed_growth_pct": 2.2}, "level18": {"hp": 2256.0, "ad": 122.1, "armor": 106.5, "mr": 66.0}, "class": "Asesino"}, {"id": "elowen", "name": "Elowen", "title": "Voz del Bosque", "race": "Dríade", "faction": "Bosque Onírico", "role": "Soporte", "damage": "Mágico", "resource": "Maná", "difficulty": 1, "lore": "Espíritu del roble más antiguo, despertado para curar la tierra herida por la guerra.", "passive": {"name": "Florecer", "desc": "Las curaciones dejan una flor que da 15 de vida extra al aliado que la pisa."}, "abilities": [{"key": "Q", "name": "Raíces Atadoras", "type": "Proyectil", "desc": "Inmoviliza 1,25 s al primer enemigo.", "cooldown": [13, 12, 11, 10, 9], "cost": 60, "base": [70, 110, 150, 190, 230], "ratio": {"ap": 0.5}, "range": 1000}, {"key": "W", "name": "Savia Vital", "type": "Curación", "desc": "Cura a un aliado y a sí misma 70-230 (+35% PH).", "cooldown": [10, 9.5, 9, 8.5, 8], "cost": 80, "base": [70, 110, 150, 190, 230], "ratio": {"ap": 0.35}, "range": 700}, {"key": "E", "name": "Corteza", "type": "Escudo aliado", "desc": "El aliado gana 20 de armadura y RM y su próximo ataque inmoviliza.", "cooldown": [14, 13, 12, 11, 10], "cost": 60, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 700}, {"key": "R", "name": "Renacer del Bosque", "type": "Área aliada", "desc": "Gran área de curación durante 3 s; los aliados que mueran en ella reviven con un 20% de vida (1 vez).", "cooldown": [160, 140, 120], "cost": 100, "base": [150, 250, 350], "ratio": {"ap": 0.6}, "range": 900}], "base_stats": {"hp": 570, "hp_g": 94, "armor": 28, "armor_g": 4.2, "mr": 30, "mr_g": 1.3, "ad": 50, "ad_g": 2.8, "ms": 335, "range": 550, "attack_speed": 0.625, "attack_speed_growth_pct": 2.0}, "level18": {"hp": 2168.0, "ad": 97.6, "armor": 99.4, "mr": 52.1}, "class": "Soporte"}, {"id": "aurik", "name": "Aurik", "title": "Heraldo Dorado", "race": "Dracónido", "faction": "Orden del Sol Partido", "role": "Soporte", "damage": "Mágico", "resource": "Maná", "difficulty": 2, "lore": "Dragón joven que adoptó forma humanoide para servir a la orden que salvó su huevo.", "passive": {"name": "Escamas de Oro", "desc": "Los aliados cercanos ganan 5 de armadura; el doble si Aurik está en forma de dragón."}, "abilities": [{"key": "Q", "name": "Aliento Solar", "type": "Cono", "desc": "Cono de fuego dorado que ralentiza un 30%.", "cooldown": [9, 8.5, 8, 7.5, 7], "cost": 60, "base": [60, 95, 130, 165, 200], "ratio": {"ap": 0.5}, "range": 550}, {"key": "W", "name": "Ala Protectora", "type": "Desplazamiento aliado", "desc": "Vuela hacia un aliado y ambos ganan un escudo de 60-200.", "cooldown": [16, 15, 14, 13, 12], "cost": 70, "base": [60, 95, 130, 165, 200], "ratio": {"ap": 0.3}, "range": 800}, {"key": "E", "name": "Rugido Dracónico", "type": "Área", "desc": "Aturde 0,75 s a los enemigos cercanos.", "cooldown": [16, 15, 14, 13, 12], "cost": 70, "base": [50, 80, 110, 140, 170], "ratio": {"ap": 0.4}, "range": 300}, {"key": "R", "name": "Forma Dragón", "type": "Transformación", "desc": "8 s: vuela (ignora terreno), +300 de vida y su Q pasa a ser una línea de 900 u.", "cooldown": [140, 120, 100], "cost": 100, "base": [100, 150, 200], "ratio": {"ap": 0.3}, "range": 0}], "base_stats": {"hp": 600, "hp_g": 94, "armor": 31, "armor_g": 4.2, "mr": 30, "mr_g": 1.3, "ad": 50, "ad_g": 2.8, "ms": 335, "range": 550, "attack_speed": 0.625, "attack_speed_growth_pct": 2.0}, "level18": {"hp": 2198.0, "ad": 97.6, "armor": 102.4, "mr": 52.1}, "class": "Soporte"}];
export const ITEMS = [
  {
    "id": "espada_larga",
    "name": "Espada Larga",
    "cost": 350,
    "stats": {
      "ad": 10
    },
    "unique": null,
    "tier": "basico"
  },
  {
    "id": "tomo_amplificador",
    "name": "Tomo Amplificador",
    "cost": 435,
    "stats": {
      "ap": 20
    },
    "unique": null,
    "tier": "basico"
  },
  {
    "id": "cinturon_gigante",
    "name": "Cinturón de Gigante",
    "cost": 900,
    "stats": {
      "hp": 350
    },
    "unique": null,
    "tier": "basico"
  },
  {
    "id": "capa_de_lino",
    "name": "Capa de Lino",
    "cost": 300,
    "stats": {
      "armor": 15
    },
    "unique": null,
    "tier": "basico"
  },
  {
    "id": "amuleto_nulo",
    "name": "Amuleto Nulo",
    "cost": 450,
    "stats": {
      "mr": 25
    },
    "unique": null,
    "tier": "basico"
  },
  {
    "id": "botas",
    "name": "Botas",
    "cost": 300,
    "stats": {
      "ms": 25
    },
    "unique": null,
    "tier": "botas",
    "nivel": 1,
    "slot": "botas"
  },
  {
    "id": "botas_de_azogue",
    "name": "Botas de Azogue",
    "cost": 1200,
    "stats": {
      "ms": 45,
      "mr": 15,
      "tenacity": 0.3
    },
    "unique": "Nivel 2. +30% de tenacidad.",
    "tier": "botas",
    "nivel": 2,
    "slot": "botas",
    "upgradeOf": "botas"
  },
  {
    "id": "botas_de_acero",
    "name": "Botas de Acero",
    "cost": 1200,
    "stats": {
      "ms": 45,
      "armor": 15
    },
    "unique": "Nivel 2. Los ataques básicos te hacen un 10% menos de daño.",
    "tier": "botas",
    "nivel": 2,
    "slot": "botas",
    "upgradeOf": "botas",
    "attackReduct": 0.1
  },
  {
    "id": "grebas_del_frenesi",
    "name": "Grebas del Frenesí",
    "cost": 1200,
    "stats": {
      "ms": 45,
      "as": 0.25
    },
    "unique": "Nivel 2. +25% de velocidad de ataque.",
    "tier": "botas",
    "nivel": 2,
    "slot": "botas",
    "upgradeOf": "botas"
  },
  {
    "id": "botas_de_lucidez",
    "name": "Botas de Lucidez",
    "cost": 1000,
    "stats": {
      "ms": 45,
      "ah": 10,
      "sumHaste": 0.1
    },
    "unique": "Nivel 2. +10 celeridad y hechizos de invocador un 10% más rápidos.",
    "tier": "botas",
    "nivel": 2,
    "slot": "botas",
    "upgradeOf": "botas"
  },
  {
    "id": "trituradoras_encadenadas",
    "name": "Trituradoras Encadenadas",
    "cost": 2200,
    "stats": {
      "ms": 55,
      "mr": 25,
      "hp": 150,
      "tenacity": 0.35
    },
    "unique": "Nivel 3 (desde el 10:00). Mejora de las Botas de Azogue.",
    "tier": "botas",
    "nivel": 3,
    "slot": "botas",
    "upgradeOf": "botas_de_azogue",
    "since": 600
  },
  {
    "id": "avance_blindado",
    "name": "Avance Blindado",
    "cost": 2200,
    "stats": {
      "ms": 55,
      "armor": 30,
      "hp": 150
    },
    "unique": "Nivel 3 (desde el 10:00). Mejora de las Botas de Acero; ataques básicos −12%.",
    "tier": "botas",
    "nivel": 3,
    "slot": "botas",
    "upgradeOf": "botas_de_acero",
    "since": 600,
    "attackReduct": 0.12
  },
  {
    "id": "lucidez_carmesi",
    "name": "Lucidez Carmesí",
    "cost": 2000,
    "stats": {
      "ms": 55,
      "ah": 20,
      "sumHaste": 0.15,
      "omnivamp": 0.05
    },
    "unique": "Nivel 3 (desde el 10:00). Mejora de las Botas de Lucidez; +5% omnivampirismo.",
    "tier": "botas",
    "nivel": 3,
    "slot": "botas",
    "upgradeOf": "botas_de_lucidez",
    "since": 600
  },
  {
    "id": "filo_del_ocaso",
    "name": "Filo del Ocaso",
    "cost": 3000,
    "stats": {
      "ad": 55,
      "crit": 0.2
    },
    "unique": "Golpes críticos +35% daño.",
    "tier": "legendario"
  },
  {
    "id": "arco_de_tormenta",
    "name": "Arco de Tormenta",
    "cost": 2900,
    "stats": {
      "ad": 35,
      "as": 0.35
    },
    "unique": "Cada 3er ataque encadena un rayo (60 mágico).",
    "tier": "legendario"
  },
  {
    "id": "baculo_de_ceniza",
    "name": "Báculo de Ceniza",
    "cost": 3100,
    "stats": {
      "ap": 90
    },
    "unique": "+30% de poder de habilidad total.",
    "tier": "legendario"
  },
  {
    "id": "orbe_del_vacio",
    "name": "Orbe del Vacío",
    "cost": 2800,
    "stats": {
      "ap": 70,
      "mpen": 0.3
    },
    "unique": "Penetración mágica 30%.",
    "tier": "legendario"
  },
  {
    "id": "coraza_de_hondaforja",
    "name": "Coraza de Hondaforja",
    "cost": 2900,
    "stats": {
      "hp": 400,
      "armor": 60
    },
    "unique": "Refleja 25% del daño de ataques recibidos.",
    "tier": "legendario"
  },
  {
    "id": "manto_onirico",
    "name": "Manto Onírico",
    "cost": 2800,
    "stats": {
      "hp": 350,
      "mr": 60
    },
    "unique": "+2% vida máx./s fuera de combate.",
    "tier": "legendario"
  },
  {
    "id": "hacha_de_colmillo",
    "name": "Hacha de Colmillo",
    "cost": 3200,
    "stats": {
      "ad": 45,
      "hp": 300,
      "ah": 20
    },
    "unique": "Tras usar una habilidad, el siguiente ataque inflige +100% AD base.",
    "tier": "legendario"
  },
  {
    "id": "incensario_dorado",
    "name": "Incensario Dorado",
    "cost": 2300,
    "stats": {
      "ap": 45,
      "heal_power": 0.12
    },
    "unique": "Curar o escudar a un aliado le da +25% vel. ataque 4 s.",
    "tier": "legendario"
  },
  {
    "id": "sed_de_sangre",
    "name": "Sed de Sangre",
    "cost": 3200,
    "stats": {
      "ad": 65,
      "ls": 0.15
    },
    "unique": "Robo de vida 15%.",
    "tier": "legendario"
  },
  {
    "id": "garra_sangrienta",
    "name": "Garra Sangrienta",
    "cost": 3000,
    "stats": {
      "ad": 40,
      "hp": 300,
      "ah": 15,
      "omnivamp": 0.08
    },
    "unique": "Omnivampirismo 8%: todo el daño cura.",
    "tier": "legendario"
  },
  {
    "id": "yelmo_del_abismo",
    "name": "Yelmo del Abismo",
    "cost": 2800,
    "stats": {
      "hp": 400,
      "mr": 45,
      "ap": 40,
      "mana": 300
    },
    "unique": "Vida, resistencia mágica y maná para magos de primera línea.",
    "tier": "legendario"
  },
  {
    "id": "cuchilla_del_verdugo",
    "name": "Cuchilla del Verdugo",
    "cost": 3000,
    "stats": {
      "ad": 40,
      "hp": 200,
      "ah": 20,
      "arpen": 0.3
    },
    "unique": "Penetración de armadura 30%.",
    "tier": "legendario"
  },
  {
    "id": "capa_del_angel",
    "name": "Capa del Ángel",
    "cost": 3200,
    "stats": {
      "ad": 45,
      "armor": 40
    },
    "unique": "Al morir renaces con el 30% de vida (180 s de enfriamiento).",
    "tier": "legendario",
    "renacer": 180
  },
  {
    "id": "eco_de_brasas",
    "name": "Eco de Brasas",
    "cost": 2800,
    "stats": {
      "ap": 100,
      "ah": 10,
      "mana": 500
    },
    "unique": "Daño de habilidad a un campeón: eco de 40 (+10% PH) mágico en área (9 s).",
    "tier": "legendario",
    "eco": 9
  },
  {
    "id": "reloj_de_estasis",
    "name": "Reloj de Estasis",
    "cost": 3300,
    "stats": {
      "ap": 110,
      "armor": 40
    },
    "unique": "ACTIVO: estasis 2,5 s (invulnerable e inmóvil). 90 s.",
    "tier": "activo",
    "slot": "activo",
    "active": "estasis",
    "activeCd": 90
  },
  {
    "id": "relicario_de_hierro",
    "name": "Relicario de Hierro",
    "cost": 2600,
    "stats": {
      "hp": 300,
      "armor": 30,
      "mr": 30,
      "ah": 10
    },
    "unique": "ACTIVO: escudo de 120 (+15/nivel) a ti y a los aliados cercanos 2,5 s. 90 s.",
    "tier": "activo",
    "slot": "activo",
    "active": "relicario",
    "activeCd": 90
  },
  {
    "id": "cinturon_cohete",
    "name": "Cinturón Cohete",
    "cost": 3000,
    "stats": {
      "ap": 80,
      "hp": 300,
      "ah": 15
    },
    "unique": "ACTIVO: impulso de 300 u y ráfaga de 100 (+25% PH) mágico. 40 s.",
    "tier": "activo",
    "slot": "activo",
    "active": "cohete",
    "activeCd": 40
  },
  {
    "id": "azogue_vital",
    "name": "Azogue Vital",
    "cost": 2900,
    "stats": {
      "ad": 40,
      "mr": 35,
      "ls": 0.1
    },
    "unique": "ACTIVO: elimina todos los controles de masas. 90 s.",
    "tier": "activo",
    "slot": "activo",
    "active": "azogue",
    "activeCd": 90
  }
];
export const MAPS = [
  {
    "id": "grieta_ceniza",
    "name": "La Grieta de Ceniza",
    "mode": "5v5 clásico",
    "size": [
      14000,
      14000
    ],
    "lanes": 3,
    "towers_per_lane": 3,
    "inhibitors": 0,
    "nexus": true,
    "objectives": [
      "Dragón Elemental (min 6, 4:30 tras morir)",
      "Heraldo de Forja (min 6, en el foso del Señor hasta el min 11)",
      "Señor de la Ceniza (min 11, cada 6 min)"
    ],
    "super_minions": "Al caer la torre base de un carril (reglas Wild Rift, sin inhibidores)",
    "jungle_camps": 12,
    "target_minutes": [
      25,
      35
    ],
    "win": "Destruir el Nexo enemigo"
  },
  {
    "id": "puente_niebla",
    "name": "Puente de la Niebla",
    "mode": "5v5 ARAM (un carril)",
    "size": [
      12000,
      3200
    ],
    "lanes": 1,
    "towers_per_lane": 4,
    "inhibitors": 1,
    "nexus": true,
    "objectives": [
      "Reliquias de vida cada 60 s"
    ],
    "jungle_camps": 0,
    "target_minutes": [
      15,
      22
    ],
    "win": "Destruir el Nexo enemigo; selección aleatoria; sin regreso a base"
  },
  {
    "id": "ruinas_eclipse",
    "name": "Ruinas del Eclipse",
    "mode": "3v3 dominio",
    "size": [
      9000,
      9000
    ],
    "lanes": 2,
    "towers_per_lane": 2,
    "inhibitors": 0,
    "nexus": true,
    "objectives": [
      "3 altares de captura (puntos)",
      "Avatar del Eclipse (min 10)"
    ],
    "jungle_camps": 6,
    "target_minutes": [
      12,
      18
    ],
    "win": "Llegar a 500 puntos o destruir el Nexo"
  }
];
export const ITEM_SETS = [
 {
  "id": "brannoc_1",
  "champ": "brannoc",
  "name": "Muralla",
  "featured": true,
  "items": [
   "botas_de_acero",
   "coraza_de_hondaforja",
   "manto_onirico",
   "relicario_de_hierro",
   "yelmo_del_abismo",
   "cinturon_gigante"
  ],
  "runes": {
   "key": "garra_del_sepulcro",
   "minors": [
    "placas_de_hueso",
    "segundo_aliento",
    "raices_profundas"
   ],
   "secondary": "triunfo"
  },
  "summoners": [
   "flash",
   "teleport"
  ],
  "popularity": 13,
  "games": 13,
  "wins": 8,
  "winrate": 0.6153846153846154
 },
 {
  "id": "brannoc_2",
  "champ": "brannoc",
  "name": "Vanguardia",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "hacha_de_colmillo",
   "coraza_de_hondaforja",
   "manto_onirico",
   "capa_del_angel",
   "cinturon_gigante"
  ],
  "runes": {
   "key": "senor_de_la_escarcha",
   "minors": [
    "placas_de_hueso",
    "inquebrantable",
    "raices_profundas"
   ],
   "secondary": "trascendencia"
  },
  "summoners": [
   "flash",
   "teleport"
  ],
  "popularity": 14,
  "games": 14,
  "wins": 7,
  "winrate": 0.5
 },
 {
  "id": "brannoc_3",
  "champ": "brannoc",
  "name": "Custodio",
  "featured": false,
  "items": [
   "botas_de_acero",
   "relicario_de_hierro",
   "manto_onirico",
   "coraza_de_hondaforja",
   "yelmo_del_abismo",
   "capa_del_angel"
  ],
  "runes": {
   "key": "custodio",
   "minors": [
    "placas_de_hueso",
    "segundo_aliento",
    "raices_profundas"
   ],
   "secondary": "ardor"
  },
  "summoners": [
   "flash",
   "teleport"
  ],
  "popularity": 17,
  "games": 17,
  "wins": 12,
  "winrate": 0.7058823529411765
 },
 {
  "id": "morgra_1",
  "champ": "morgra",
  "name": "Muralla",
  "featured": true,
  "items": [
   "botas_de_acero",
   "coraza_de_hondaforja",
   "manto_onirico",
   "relicario_de_hierro",
   "yelmo_del_abismo",
   "cinturon_gigante"
  ],
  "runes": {
   "key": "garra_del_sepulcro",
   "minors": [
    "placas_de_hueso",
    "segundo_aliento",
    "raices_profundas"
   ],
   "secondary": "triunfo"
  },
  "summoners": [
   "flash",
   "smite"
  ],
  "popularity": 11,
  "games": 11,
  "wins": 5,
  "winrate": 0.45454545454545453
 },
 {
  "id": "morgra_2",
  "champ": "morgra",
  "name": "Vanguardia",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "hacha_de_colmillo",
   "coraza_de_hondaforja",
   "manto_onirico",
   "capa_del_angel",
   "cinturon_gigante"
  ],
  "runes": {
   "key": "senor_de_la_escarcha",
   "minors": [
    "placas_de_hueso",
    "inquebrantable",
    "raices_profundas"
   ],
   "secondary": "trascendencia"
  },
  "summoners": [
   "flash",
   "smite"
  ],
  "popularity": 13,
  "games": 13,
  "wins": 7,
  "winrate": 0.5384615384615384
 },
 {
  "id": "morgra_3",
  "champ": "morgra",
  "name": "Custodio",
  "featured": false,
  "items": [
   "botas_de_acero",
   "relicario_de_hierro",
   "manto_onirico",
   "coraza_de_hondaforja",
   "yelmo_del_abismo",
   "capa_del_angel"
  ],
  "runes": {
   "key": "custodio",
   "minors": [
    "placas_de_hueso",
    "segundo_aliento",
    "raices_profundas"
   ],
   "secondary": "ardor"
  },
  "summoners": [
   "flash",
   "smite"
  ],
  "popularity": 10,
  "games": 10,
  "wins": 6,
  "winrate": 0.6
 },
 {
  "id": "ossuar_1",
  "champ": "ossuar",
  "name": "Muralla",
  "featured": true,
  "items": [
   "botas_de_acero",
   "coraza_de_hondaforja",
   "manto_onirico",
   "relicario_de_hierro",
   "yelmo_del_abismo",
   "cinturon_gigante"
  ],
  "runes": {
   "key": "garra_del_sepulcro",
   "minors": [
    "placas_de_hueso",
    "segundo_aliento",
    "raices_profundas"
   ],
   "secondary": "triunfo"
  },
  "summoners": [
   "flash",
   "teleport"
  ],
  "popularity": 10,
  "games": 10,
  "wins": 3,
  "winrate": 0.3
 },
 {
  "id": "ossuar_2",
  "champ": "ossuar",
  "name": "Vanguardia",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "hacha_de_colmillo",
   "coraza_de_hondaforja",
   "manto_onirico",
   "capa_del_angel",
   "cinturon_gigante"
  ],
  "runes": {
   "key": "senor_de_la_escarcha",
   "minors": [
    "placas_de_hueso",
    "inquebrantable",
    "raices_profundas"
   ],
   "secondary": "trascendencia"
  },
  "summoners": [
   "flash",
   "teleport"
  ],
  "popularity": 12,
  "games": 12,
  "wins": 6,
  "winrate": 0.5
 },
 {
  "id": "ossuar_3",
  "champ": "ossuar",
  "name": "Custodio",
  "featured": false,
  "items": [
   "botas_de_acero",
   "relicario_de_hierro",
   "manto_onirico",
   "coraza_de_hondaforja",
   "yelmo_del_abismo",
   "capa_del_angel"
  ],
  "runes": {
   "key": "custodio",
   "minors": [
    "placas_de_hueso",
    "segundo_aliento",
    "raices_profundas"
   ],
   "secondary": "ardor"
  },
  "summoners": [
   "flash",
   "teleport"
  ],
  "popularity": 5,
  "games": 5,
  "wins": 1,
  "winrate": 0.2
 },
 {
  "id": "kaelith_1",
  "champ": "kaelith",
  "name": "Sangría",
  "featured": true,
  "items": [
   "botas_de_acero",
   "garra_sangrienta",
   "hacha_de_colmillo",
   "coraza_de_hondaforja",
   "sed_de_sangre",
   "capa_del_angel"
  ],
  "runes": {
   "key": "vencedor",
   "minors": [
    "brutal",
    "triunfo",
    "golpe_de_gracia"
   ],
   "secondary": "segundo_aliento"
  },
  "summoners": [
   "flash",
   "teleport"
  ],
  "popularity": 6,
  "games": 6,
  "wins": 3,
  "winrate": 0.5
 },
 {
  "id": "kaelith_2",
  "champ": "kaelith",
  "name": "Verdugo",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "hacha_de_colmillo",
   "cuchilla_del_verdugo",
   "manto_onirico",
   "capa_del_angel",
   "azogue_vital"
  ],
  "runes": {
   "key": "asedio",
   "minors": [
    "brutal",
    "triunfo",
    "ardor"
   ],
   "secondary": "inquebrantable"
  },
  "summoners": [
   "flash",
   "teleport"
  ],
  "popularity": 6,
  "games": 6,
  "wins": 2,
  "winrate": 0.3333333333333333
 },
 {
  "id": "kaelith_3",
  "champ": "kaelith",
  "name": "Garra",
  "featured": false,
  "items": [
   "botas_de_acero",
   "sed_de_sangre",
   "hacha_de_colmillo",
   "capa_del_angel",
   "garra_sangrienta",
   "manto_onirico"
  ],
  "runes": {
   "key": "garra_del_sepulcro",
   "minors": [
    "placas_de_hueso",
    "segundo_aliento",
    "raices_profundas"
   ],
   "secondary": "brutal"
  },
  "summoners": [
   "flash",
   "teleport"
  ],
  "popularity": 7,
  "games": 7,
  "wins": 3,
  "winrate": 0.42857142857142855
 },
 {
  "id": "tharok_1",
  "champ": "tharok",
  "name": "Sangría",
  "featured": true,
  "items": [
   "botas_de_acero",
   "garra_sangrienta",
   "hacha_de_colmillo",
   "coraza_de_hondaforja",
   "sed_de_sangre",
   "capa_del_angel"
  ],
  "runes": {
   "key": "vencedor",
   "minors": [
    "brutal",
    "triunfo",
    "golpe_de_gracia"
   ],
   "secondary": "segundo_aliento"
  },
  "summoners": [
   "flash",
   "smite"
  ],
  "popularity": 10,
  "games": 10,
  "wins": 5,
  "winrate": 0.5
 },
 {
  "id": "tharok_2",
  "champ": "tharok",
  "name": "Verdugo",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "hacha_de_colmillo",
   "cuchilla_del_verdugo",
   "manto_onirico",
   "capa_del_angel",
   "azogue_vital"
  ],
  "runes": {
   "key": "asedio",
   "minors": [
    "brutal",
    "triunfo",
    "ardor"
   ],
   "secondary": "inquebrantable"
  },
  "summoners": [
   "flash",
   "smite"
  ],
  "popularity": 5,
  "games": 5,
  "wins": 3,
  "winrate": 0.6
 },
 {
  "id": "tharok_3",
  "champ": "tharok",
  "name": "Garra",
  "featured": false,
  "items": [
   "botas_de_acero",
   "sed_de_sangre",
   "hacha_de_colmillo",
   "capa_del_angel",
   "garra_sangrienta",
   "manto_onirico"
  ],
  "runes": {
   "key": "garra_del_sepulcro",
   "minors": [
    "placas_de_hueso",
    "segundo_aliento",
    "raices_profundas"
   ],
   "secondary": "brutal"
  },
  "summoners": [
   "flash",
   "smite"
  ],
  "popularity": 4,
  "games": 4,
  "wins": 0,
  "winrate": 0
 },
 {
  "id": "yssra_1",
  "champ": "yssra",
  "name": "Sangría",
  "featured": true,
  "items": [
   "botas_de_acero",
   "garra_sangrienta",
   "hacha_de_colmillo",
   "coraza_de_hondaforja",
   "sed_de_sangre",
   "capa_del_angel"
  ],
  "runes": {
   "key": "vencedor",
   "minors": [
    "brutal",
    "triunfo",
    "golpe_de_gracia"
   ],
   "secondary": "segundo_aliento"
  },
  "summoners": [
   "flash",
   "ignite"
  ],
  "popularity": 5,
  "games": 5,
  "wins": 1,
  "winrate": 0.2
 },
 {
  "id": "yssra_2",
  "champ": "yssra",
  "name": "Verdugo",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "hacha_de_colmillo",
   "cuchilla_del_verdugo",
   "manto_onirico",
   "capa_del_angel",
   "azogue_vital"
  ],
  "runes": {
   "key": "asedio",
   "minors": [
    "brutal",
    "triunfo",
    "ardor"
   ],
   "secondary": "inquebrantable"
  },
  "summoners": [
   "flash",
   "ignite"
  ],
  "popularity": 2,
  "games": 2,
  "wins": 1,
  "winrate": 0.5
 },
 {
  "id": "yssra_3",
  "champ": "yssra",
  "name": "Garra",
  "featured": false,
  "items": [
   "botas_de_acero",
   "sed_de_sangre",
   "hacha_de_colmillo",
   "capa_del_angel",
   "garra_sangrienta",
   "manto_onirico"
  ],
  "runes": {
   "key": "garra_del_sepulcro",
   "minors": [
    "placas_de_hueso",
    "segundo_aliento",
    "raices_profundas"
   ],
   "secondary": "brutal"
  },
  "summoners": [
   "flash",
   "ignite"
  ],
  "popularity": 11,
  "games": 11,
  "wins": 3,
  "winrate": 0.2727272727272727
 },
 {
  "id": "vaelor_1",
  "champ": "vaelor",
  "name": "Incendio",
  "featured": true,
  "items": [
   "botas_de_lucidez",
   "baculo_de_ceniza",
   "orbe_del_vacio",
   "eco_de_brasas",
   "reloj_de_estasis",
   "yelmo_del_abismo"
  ],
  "runes": {
   "key": "tormenta_rapida",
   "minors": [
    "golpe_barato",
    "impacto_subito",
    "trofeos"
   ],
   "secondary": "caudal_de_mana"
  },
  "summoners": [
   "flash",
   "ignite"
  ],
  "popularity": 11,
  "games": 11,
  "wins": 6,
  "winrate": 0.5454545454545454
 },
 {
  "id": "vaelor_2",
  "champ": "vaelor",
  "name": "Cometa",
  "featured": false,
  "items": [
   "botas_de_lucidez",
   "eco_de_brasas",
   "baculo_de_ceniza",
   "yelmo_del_abismo",
   "orbe_del_vacio",
   "reloj_de_estasis"
  ],
  "runes": {
   "key": "cometa_de_ceniza",
   "minors": [
    "caudal_de_mana",
    "trascendencia",
    "chamuscar"
   ],
   "secondary": "brutal"
  },
  "summoners": [
   "flash",
   "ignite"
  ],
  "popularity": 13,
  "games": 13,
  "wins": 9,
  "winrate": 0.6923076923076923
 },
 {
  "id": "vaelor_3",
  "champ": "vaelor",
  "name": "Cohete",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "cinturon_cohete",
   "baculo_de_ceniza",
   "orbe_del_vacio",
   "eco_de_brasas",
   "yelmo_del_abismo"
  ],
  "runes": {
   "key": "luciernaga",
   "minors": [
    "caudal_de_mana",
    "trascendencia",
    "tormenta_creciente"
   ],
   "secondary": "triunfo"
  },
  "summoners": [
   "flash",
   "ignite"
  ],
  "popularity": 4,
  "games": 4,
  "wins": 0,
  "winrate": 0
 },
 {
  "id": "nyxe_1",
  "champ": "nyxe",
  "name": "Incendio",
  "featured": true,
  "items": [
   "botas_de_lucidez",
   "baculo_de_ceniza",
   "orbe_del_vacio",
   "eco_de_brasas",
   "reloj_de_estasis",
   "yelmo_del_abismo"
  ],
  "runes": {
   "key": "tormenta_rapida",
   "minors": [
    "golpe_barato",
    "impacto_subito",
    "trofeos"
   ],
   "secondary": "caudal_de_mana"
  },
  "summoners": [
   "flash",
   "ignite"
  ],
  "popularity": 13,
  "games": 13,
  "wins": 9,
  "winrate": 0.6923076923076923
 },
 {
  "id": "nyxe_2",
  "champ": "nyxe",
  "name": "Cometa",
  "featured": false,
  "items": [
   "botas_de_lucidez",
   "eco_de_brasas",
   "baculo_de_ceniza",
   "yelmo_del_abismo",
   "orbe_del_vacio",
   "reloj_de_estasis"
  ],
  "runes": {
   "key": "cometa_de_ceniza",
   "minors": [
    "caudal_de_mana",
    "trascendencia",
    "chamuscar"
   ],
   "secondary": "brutal"
  },
  "summoners": [
   "flash",
   "ignite"
  ],
  "popularity": 6,
  "games": 6,
  "wins": 3,
  "winrate": 0.5
 },
 {
  "id": "nyxe_3",
  "champ": "nyxe",
  "name": "Cohete",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "cinturon_cohete",
   "baculo_de_ceniza",
   "orbe_del_vacio",
   "eco_de_brasas",
   "yelmo_del_abismo"
  ],
  "runes": {
   "key": "luciernaga",
   "minors": [
    "caudal_de_mana",
    "trascendencia",
    "tormenta_creciente"
   ],
   "secondary": "triunfo"
  },
  "summoners": [
   "flash",
   "ignite"
  ],
  "popularity": 7,
  "games": 7,
  "wins": 5,
  "winrate": 0.7142857142857143
 },
 {
  "id": "zerath_1",
  "champ": "zerath",
  "name": "Incendio",
  "featured": true,
  "items": [
   "botas_de_lucidez",
   "baculo_de_ceniza",
   "orbe_del_vacio",
   "eco_de_brasas",
   "reloj_de_estasis",
   "yelmo_del_abismo"
  ],
  "runes": {
   "key": "tormenta_rapida",
   "minors": [
    "golpe_barato",
    "impacto_subito",
    "trofeos"
   ],
   "secondary": "caudal_de_mana"
  },
  "summoners": [
   "flash",
   "ignite"
  ],
  "popularity": 6,
  "games": 6,
  "wins": 2,
  "winrate": 0.3333333333333333
 },
 {
  "id": "zerath_2",
  "champ": "zerath",
  "name": "Cometa",
  "featured": false,
  "items": [
   "botas_de_lucidez",
   "eco_de_brasas",
   "baculo_de_ceniza",
   "yelmo_del_abismo",
   "orbe_del_vacio",
   "reloj_de_estasis"
  ],
  "runes": {
   "key": "cometa_de_ceniza",
   "minors": [
    "caudal_de_mana",
    "trascendencia",
    "chamuscar"
   ],
   "secondary": "brutal"
  },
  "summoners": [
   "flash",
   "ignite"
  ],
  "popularity": 1,
  "games": 1,
  "wins": 0,
  "winrate": 0
 },
 {
  "id": "zerath_3",
  "champ": "zerath",
  "name": "Cohete",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "cinturon_cohete",
   "baculo_de_ceniza",
   "orbe_del_vacio",
   "eco_de_brasas",
   "yelmo_del_abismo"
  ],
  "runes": {
   "key": "luciernaga",
   "minors": [
    "caudal_de_mana",
    "trascendencia",
    "tormenta_creciente"
   ],
   "secondary": "triunfo"
  },
  "summoners": [
   "flash",
   "ignite"
  ],
  "popularity": 11,
  "games": 11,
  "wins": 6,
  "winrate": 0.5454545454545454
 },
 {
  "id": "lyra_1",
  "champ": "lyra",
  "name": "Crítico",
  "featured": true,
  "items": [
   "grebas_del_frenesi",
   "filo_del_ocaso",
   "arco_de_tormenta",
   "sed_de_sangre",
   "cuchilla_del_verdugo",
   "capa_del_angel"
  ],
  "runes": {
   "key": "compas_letal",
   "minors": [
    "brutal",
    "triunfo",
    "golpe_de_gracia"
   ],
   "secondary": "cazador_incansable"
  },
  "summoners": [
   "flash",
   "heal"
  ],
  "popularity": 9,
  "games": 9,
  "wins": 4,
  "winrate": 0.4444444444444444
 },
 {
  "id": "lyra_2",
  "champ": "lyra",
  "name": "Tormenta",
  "featured": false,
  "items": [
   "grebas_del_frenesi",
   "arco_de_tormenta",
   "filo_del_ocaso",
   "sed_de_sangre",
   "azogue_vital",
   "capa_del_angel"
  ],
  "runes": {
   "key": "pies_de_viento",
   "minors": [
    "ardor",
    "triunfo",
    "golpe_de_gracia"
   ],
   "secondary": "raices_profundas"
  },
  "summoners": [
   "flash",
   "heal"
  ],
  "popularity": 14,
  "games": 14,
  "wins": 8,
  "winrate": 0.5714285714285714
 },
 {
  "id": "lyra_3",
  "champ": "lyra",
  "name": "Verdugo",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "cuchilla_del_verdugo",
   "filo_del_ocaso",
   "sed_de_sangre",
   "arco_de_tormenta",
   "capa_del_angel"
  ],
  "runes": {
   "key": "vencedor",
   "minors": [
    "brutal",
    "triunfo",
    "ardor"
   ],
   "secondary": "impacto_subito"
  },
  "summoners": [
   "flash",
   "heal"
  ],
  "popularity": 22,
  "games": 22,
  "wins": 13,
  "winrate": 0.5909090909090909
 },
 {
  "id": "gearix_1",
  "champ": "gearix",
  "name": "Crítico",
  "featured": true,
  "items": [
   "grebas_del_frenesi",
   "filo_del_ocaso",
   "arco_de_tormenta",
   "sed_de_sangre",
   "cuchilla_del_verdugo",
   "capa_del_angel"
  ],
  "runes": {
   "key": "compas_letal",
   "minors": [
    "brutal",
    "triunfo",
    "golpe_de_gracia"
   ],
   "secondary": "cazador_incansable"
  },
  "summoners": [
   "flash",
   "heal"
  ],
  "popularity": 11,
  "games": 11,
  "wins": 4,
  "winrate": 0.36363636363636365
 },
 {
  "id": "gearix_2",
  "champ": "gearix",
  "name": "Tormenta",
  "featured": false,
  "items": [
   "grebas_del_frenesi",
   "arco_de_tormenta",
   "filo_del_ocaso",
   "sed_de_sangre",
   "azogue_vital",
   "capa_del_angel"
  ],
  "runes": {
   "key": "pies_de_viento",
   "minors": [
    "ardor",
    "triunfo",
    "golpe_de_gracia"
   ],
   "secondary": "raices_profundas"
  },
  "summoners": [
   "flash",
   "heal"
  ],
  "popularity": 20,
  "games": 20,
  "wins": 8,
  "winrate": 0.4
 },
 {
  "id": "gearix_3",
  "champ": "gearix",
  "name": "Verdugo",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "cuchilla_del_verdugo",
   "filo_del_ocaso",
   "sed_de_sangre",
   "arco_de_tormenta",
   "capa_del_angel"
  ],
  "runes": {
   "key": "vencedor",
   "minors": [
    "brutal",
    "triunfo",
    "ardor"
   ],
   "secondary": "impacto_subito"
  },
  "summoners": [
   "flash",
   "heal"
  ],
  "popularity": 14,
  "games": 14,
  "wins": 8,
  "winrate": 0.5714285714285714
 },
 {
  "id": "sable_1",
  "champ": "sable",
  "name": "Sombra",
  "featured": true,
  "items": [
   "botas_de_acero",
   "cuchilla_del_verdugo",
   "hacha_de_colmillo",
   "sed_de_sangre",
   "capa_del_angel",
   "filo_del_ocaso"
  ],
  "runes": {
   "key": "tormenta_rapida",
   "minors": [
    "golpe_barato",
    "impacto_subito",
    "cazador_incansable"
   ],
   "secondary": "brutal"
  },
  "summoners": [
   "flash",
   "smite"
  ],
  "popularity": 11,
  "games": 11,
  "wins": 6,
  "winrate": 0.5454545454545454
 },
 {
  "id": "sable_2",
  "champ": "sable",
  "name": "Emboscada",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "hacha_de_colmillo",
   "cuchilla_del_verdugo",
   "garra_sangrienta",
   "azogue_vital",
   "manto_onirico"
  ],
  "runes": {
   "key": "siega_sombria",
   "minors": [
    "golpe_barato",
    "trofeos",
    "cazador_incansable"
   ],
   "secondary": "triunfo"
  },
  "summoners": [
   "flash",
   "smite"
  ],
  "popularity": 4,
  "games": 4,
  "wins": 1,
  "winrate": 0.25
 },
 {
  "id": "sable_3",
  "champ": "sable",
  "name": "Primer Tajo",
  "featured": false,
  "items": [
   "botas_de_acero",
   "cuchilla_del_verdugo",
   "filo_del_ocaso",
   "sed_de_sangre",
   "capa_del_angel",
   "coraza_de_hondaforja"
  ],
  "runes": {
   "key": "primer_tajo",
   "minors": [
    "impacto_subito",
    "trofeos",
    "cazador_incansable"
   ],
   "secondary": "golpe_de_gracia"
  },
  "summoners": [
   "flash",
   "smite"
  ],
  "popularity": 6,
  "games": 6,
  "wins": 3,
  "winrate": 0.5
 },
 {
  "id": "rakhar_1",
  "champ": "rakhar",
  "name": "Sombra",
  "featured": true,
  "items": [
   "botas_de_acero",
   "cuchilla_del_verdugo",
   "hacha_de_colmillo",
   "sed_de_sangre",
   "capa_del_angel",
   "filo_del_ocaso"
  ],
  "runes": {
   "key": "tormenta_rapida",
   "minors": [
    "golpe_barato",
    "impacto_subito",
    "cazador_incansable"
   ],
   "secondary": "brutal"
  },
  "summoners": [
   "flash",
   "smite"
  ],
  "popularity": 7,
  "games": 7,
  "wins": 3,
  "winrate": 0.42857142857142855
 },
 {
  "id": "rakhar_2",
  "champ": "rakhar",
  "name": "Emboscada",
  "featured": false,
  "items": [
   "botas_de_azogue",
   "hacha_de_colmillo",
   "cuchilla_del_verdugo",
   "garra_sangrienta",
   "azogue_vital",
   "manto_onirico"
  ],
  "runes": {
   "key": "siega_sombria",
   "minors": [
    "golpe_barato",
    "trofeos",
    "cazador_incansable"
   ],
   "secondary": "triunfo"
  },
  "summoners": [
   "flash",
   "smite"
  ],
  "popularity": 8,
  "games": 8,
  "wins": 5,
  "winrate": 0.625
 },
 {
  "id": "rakhar_3",
  "champ": "rakhar",
  "name": "Primer Tajo",
  "featured": false,
  "items": [
   "botas_de_acero",
   "cuchilla_del_verdugo",
   "filo_del_ocaso",
   "sed_de_sangre",
   "capa_del_angel",
   "coraza_de_hondaforja"
  ],
  "runes": {
   "key": "primer_tajo",
   "minors": [
    "impacto_subito",
    "trofeos",
    "cazador_incansable"
   ],
   "secondary": "golpe_de_gracia"
  },
  "summoners": [
   "flash",
   "smite"
  ],
  "popularity": 1,
  "games": 1,
  "wins": 1,
  "winrate": 1
 },
 {
  "id": "elowen_1",
  "champ": "elowen",
  "name": "Guardián",
  "featured": true,
  "items": [
   "botas_de_azogue",
   "incensario_dorado",
   "relicario_de_hierro",
   "manto_onirico",
   "coraza_de_hondaforja",
   "yelmo_del_abismo"
  ],
  "runes": {
   "key": "custodio",
   "minors": [
    "placas_de_hueso",
    "segundo_aliento",
    "raices_profundas"
   ],
   "secondary": "caudal_de_mana"
  },
  "summoners": [
   "flash",
   "exhaust"
  ],
  "popularity": 25,
  "games": 25,
  "wins": 18,
  "winrate": 0.72
 },
 {
  "id": "elowen_2",
  "champ": "elowen",
  "name": "Luciérnaga",
  "featured": false,
  "items": [
   "botas_de_lucidez",
   "incensario_dorado",
   "eco_de_brasas",
   "manto_onirico",
   "yelmo_del_abismo",
   "relicario_de_hierro"
  ],
  "runes": {
   "key": "luciernaga",
   "minors": [
    "caudal_de_mana",
    "trascendencia",
    "chamuscar"
   ],
   "secondary": "segundo_aliento"
  },
  "summoners": [
   "flash",
   "exhaust"
  ],
  "popularity": 6,
  "games": 6,
  "wins": 2,
  "winrate": 0.3333333333333333
 },
 {
  "id": "elowen_3",
  "champ": "elowen",
  "name": "Escarcha",
  "featured": false,
  "items": [
   "botas_de_acero",
   "relicario_de_hierro",
   "coraza_de_hondaforja",
   "manto_onirico",
   "incensario_dorado",
   "capa_del_angel"
  ],
  "runes": {
   "key": "senor_de_la_escarcha",
   "minors": [
    "placas_de_hueso",
    "inquebrantable",
    "raices_profundas"
   ],
   "secondary": "triunfo"
  },
  "summoners": [
   "flash",
   "exhaust"
  ],
  "popularity": 14,
  "games": 14,
  "wins": 7,
  "winrate": 0.5
 },
 {
  "id": "aurik_1",
  "champ": "aurik",
  "name": "Guardián",
  "featured": true,
  "items": [
   "botas_de_azogue",
   "incensario_dorado",
   "relicario_de_hierro",
   "manto_onirico",
   "coraza_de_hondaforja",
   "yelmo_del_abismo"
  ],
  "runes": {
   "key": "custodio",
   "minors": [
    "placas_de_hueso",
    "segundo_aliento",
    "raices_profundas"
   ],
   "secondary": "caudal_de_mana"
  },
  "summoners": [
   "flash",
   "exhaust"
  ],
  "popularity": 21,
  "games": 21,
  "wins": 10,
  "winrate": 0.47619047619047616
 },
 {
  "id": "aurik_2",
  "champ": "aurik",
  "name": "Luciérnaga",
  "featured": false,
  "items": [
   "botas_de_lucidez",
   "incensario_dorado",
   "eco_de_brasas",
   "manto_onirico",
   "yelmo_del_abismo",
   "relicario_de_hierro"
  ],
  "runes": {
   "key": "luciernaga",
   "minors": [
    "caudal_de_mana",
    "trascendencia",
    "chamuscar"
   ],
   "secondary": "segundo_aliento"
  },
  "summoners": [
   "flash",
   "exhaust"
  ],
  "popularity": 17,
  "games": 17,
  "wins": 6,
  "winrate": 0.35294117647058826
 },
 {
  "id": "aurik_3",
  "champ": "aurik",
  "name": "Escarcha",
  "featured": false,
  "items": [
   "botas_de_acero",
   "relicario_de_hierro",
   "coraza_de_hondaforja",
   "manto_onirico",
   "incensario_dorado",
   "capa_del_angel"
  ],
  "runes": {
   "key": "senor_de_la_escarcha",
   "minors": [
    "placas_de_hueso",
    "inquebrantable",
    "raices_profundas"
   ],
   "secondary": "triunfo"
  },
  "summoners": [
   "flash",
   "exhaust"
  ],
  "popularity": 7,
  "games": 7,
  "wins": 2,
  "winrate": 0.2857142857142857
 }
];
export const RUNES = {
  "branches": [
    { "id": "acero",  "name": "Acero",  "color": "#ffca28", "desc": "Ataques sostenidos y duelos largos" },
    { "id": "sombra", "name": "Sombra", "color": "#ef5350", "desc": "Daño explosivo y caza" },
    { "id": "roca",   "name": "Roca",   "color": "#66bb6a", "desc": "Resistencia y protección" },
    { "id": "arcano", "name": "Arcano", "color": "#7e57c2", "desc": "Habilidades, maná y movilidad" }
  ],
  "runes": [
    { "id": "asedio",             "branch": "acero",  "slot": "clave", "name": "Asedio",               "icon": "⚔", "desc": "Tres ataques básicos seguidos a un campeón infligen 30 (+6/nivel) de daño adaptativo y lo dejan expuesto: recibe +8% de daño durante 6 s." },
    { "id": "compas_letal",       "branch": "acero",  "slot": "clave", "name": "Compás Letal",         "icon": "♪", "desc": "Atacar a un campeón da +10% de velocidad de ataque por carga (máx. 6, 6 s). Con 6 cargas, +50 de alcance." },
    { "id": "pies_de_viento",     "branch": "acero",  "slot": "clave", "name": "Pies de Viento",       "icon": "🌬", "desc": "Cada 2 s, el siguiente ataque cura 5 (+1,5/nivel) y da +20% de velocidad de movimiento durante 1 s." },
    { "id": "vencedor",           "branch": "acero",  "slot": "clave", "name": "Vencedor",             "icon": "⚑", "desc": "Cada golpe o habilidad a un campeón da una carga (máx. 6, 6 s): +2 AD o +4 PH por carga. Con 6 cargas, 9% de omnivampirismo (5% a distancia)." },
    { "id": "tormenta_rapida",    "branch": "sombra", "slot": "clave", "name": "Tormenta Rápida",      "icon": "⚡", "desc": "Golpear a un campeón 3 veces en 3 s descarga un rayo de 30 (+8/nivel) de daño adaptativo. 20 s de enfriamiento." },
    { "id": "siega_sombria",      "branch": "sombra", "slot": "clave", "name": "Siega Sombría",        "icon": "☠", "desc": "Dañar a un campeón con menos del 50% de vida inflige 20 (+5/nivel) + 5 por alma de daño adaptativo y recoge un alma. 25 s; 1 s tras un derribo." },
    { "id": "primer_tajo",        "branch": "sombra", "slot": "clave", "name": "Primer Tajo",          "icon": "➶", "desc": "Si golpeas a un campeón antes de que te golpee a ti: +15 de oro y +7% de daño durante 3 s. 25 s de enfriamiento." },
    { "id": "garra_del_sepulcro", "branch": "roca",   "slot": "clave", "name": "Garra del Sepulcro",   "icon": "✊", "desc": "Cada 3 s en combate cargas la garra: el siguiente ataque inflige 3% de tu vida máxima en daño mágico, cura el 1,5% y te da +3 de vida máxima para siempre." },
    { "id": "custodio",           "branch": "roca",   "slot": "clave", "name": "Custodio",             "icon": "🛡", "desc": "Cuando un campeón te golpea, tú y el aliado más cercano (350 u) ganáis un escudo de 40 (+10/nivel) durante 2 s. 60 s de enfriamiento." },
    { "id": "senor_de_la_escarcha","branch": "roca",  "slot": "clave", "name": "Señor de la Escarcha", "icon": "❄", "desc": "Inmovilizar a un campeón crea una zona de hielo (ralentiza 30% durante 2 s) y te da +30 de armadura y RM durante 2,5 s. 20 s." },
    { "id": "luciernaga",         "branch": "arcano", "slot": "clave", "name": "Luciérnaga",           "icon": "✧", "desc": "Dañar a un campeón con una habilidad inflige 10 (+3/nivel) de daño mágico extra; curar o escudar a un aliado le da un escudo de 20 (+4/nivel). 3 s." },
    { "id": "cometa_de_ceniza",   "branch": "arcano", "slot": "clave", "name": "Cometa de Ceniza",     "icon": "☄", "desc": "Dañar a un campeón con una habilidad hace caer un cometa de 30 (+6/nivel) de daño mágico 0,6 s después. 12 s de enfriamiento." },
    { "id": "paso_de_fase",       "branch": "arcano", "slot": "clave", "name": "Paso de Fase",         "icon": "⟫", "desc": "Golpear a un campeón 3 veces en 4 s da +30% de velocidad de movimiento y +10 de celeridad durante 3 s. 15 s." },

    { "id": "brutal",             "branch": "acero",  "slot": "menor", "name": "Brutal",               "icon": "✦", "desc": "+6 AD y +10 PH.", "stats": { "ad": 6, "ap": 10 } },
    { "id": "triunfo",            "branch": "acero",  "slot": "menor", "name": "Triunfo",              "icon": "♛", "desc": "Al participar en un derribo curas el 10% de la vida que te falta y ganas 20 de oro." },
    { "id": "ardor",              "branch": "acero",  "slot": "menor", "name": "Ardor",                "icon": "🔥", "desc": "+10% de velocidad de ataque.", "stats": { "as": 0.10 } },
    { "id": "golpe_de_gracia",    "branch": "acero",  "slot": "menor", "name": "Golpe de Gracia",      "icon": "⚔", "desc": "+8% de daño a campeones con menos del 40% de vida." },
    { "id": "golpe_barato",       "branch": "sombra", "slot": "menor", "name": "Golpe Barato",         "icon": "✂", "desc": "Dañar a un campeón bajo control de masas inflige 10 (+2/nivel) de daño verdadero extra. 4 s." },
    { "id": "impacto_subito",     "branch": "sombra", "slot": "menor", "name": "Impacto Súbito",       "icon": "➹", "desc": "+8% de penetración de armadura y mágica.", "stats": { "arpen": 0.08, "mpen": 0.08 } },
    { "id": "trofeos",            "branch": "sombra", "slot": "menor", "name": "Trofeos",              "icon": "👁", "desc": "Cada derribo da +2 AD o +4 PH (máx. 5 trofeos)." },
    { "id": "cazador_incansable", "branch": "sombra", "slot": "menor", "name": "Cazador Incansable",   "icon": "🐾", "desc": "+12 de velocidad de movimiento.", "stats": { "ms": 12 } },
    { "id": "placas_de_hueso",    "branch": "roca",   "slot": "menor", "name": "Placas de Hueso",      "icon": "🦴", "desc": "+8 de armadura y +8 de resistencia mágica.", "stats": { "armor": 8, "mr": 8 } },
    { "id": "segundo_aliento",    "branch": "roca",   "slot": "menor", "name": "Segundo Aliento",      "icon": "♻", "desc": "Con menos del 50% de vida regeneras 4 (+0,5/nivel) de vida por segundo extra." },
    { "id": "inquebrantable",     "branch": "roca",   "slot": "menor", "name": "Inquebrantable",       "icon": "⛓", "desc": "+20% de tenacidad.", "stats": { "tenacity": 0.20 } },
    { "id": "raices_profundas",   "branch": "roca",   "slot": "menor", "name": "Raíces Profundas",     "icon": "🌱", "desc": "+100 de vida máxima.", "stats": { "maxHp": 100 } },
    { "id": "trascendencia",      "branch": "arcano", "slot": "menor", "name": "Trascendencia",        "icon": "⌛", "desc": "+10 de celeridad de habilidades.", "stats": { "ah": 10 } },
    { "id": "caudal_de_mana",     "branch": "arcano", "slot": "menor", "name": "Caudal de Maná",       "icon": "💧", "desc": "+200 de maná máximo.", "stats": { "mana": 200 } },
    { "id": "tormenta_creciente", "branch": "arcano", "slot": "menor", "name": "Tormenta Creciente",   "icon": "🌩", "desc": "Cada 5 minutos ganas +4 AD y +7 PH acumulables." },
    { "id": "chamuscar",          "branch": "arcano", "slot": "menor", "name": "Chamuscar",            "icon": "♨", "desc": "Dañar a un campeón con una habilidad lo quema: 15 (+2/nivel) de daño mágico tras 1 s. 10 s." }
  ]
}
;
export const PRESENTATION = [{"id": "brannoc", "name": "Brannoc", "title": "El Yunque Viviente", "tipoAtaque": "melee", "arma": "Martillo de forja a dos manos", "cuerpo": "Enano bajo y ancho (1,9 m), armadura de placas con yunque al pecho", "color": "#ffb74d", "clase": "Tanque", "raza": "Enano", "rol": "Top / Soporte", "faccion": "Clanes de Hondaforja", "recurso": "Maná", "dificultad": 1, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "estela", "color": "#ffb74d", "name": "Martillazo Sísmico"}, "W": {"kind": "aura", "color": "#ffb74d", "name": "Templar Acero"}, "E": {"kind": "estela", "color": "#ffb74d", "name": "Carga de Forja"}, "R": {"kind": "glifo", "color": "#ffb74d", "name": "Ruptura de la Montaña"}}, "death": {"kind": "fragmentos", "color": "#ffb74d"}}, "aspectos": [{"id": "base", "nombre": "Yunque Viviente", "modelo": "champ_brannoc"}], "lore": "Herrero-guardián que se fundió a sí mismo con su yunque para cerrar la Puerta de Hondaforja.", "pasiva": {"name": "Piel de Yunque", "desc": "Cada 8 s gana un escudo del 8% de vida máx. que se refresca si no recibe daño en 4 s."}, "Q": {"name": "Martillazo Sísmico", "type": "Línea", "desc": "Golpea el suelo; daña y ralentiza un 40% 1,5 s.", "cooldown": [9, 8.5, 8, 7.5, 7], "cost": 50, "base": [70, 110, 150, 190, 230], "ratio": {"ad": 0.6}, "range": 600}, "W": {"name": "Templar Acero", "type": "Autobuff", "desc": "+20/25/30/35/40 armadura y RM durante 4 s; refleja 15 de daño por golpe.", "cooldown": [14, 13, 12, 11, 10], "cost": 60, "base": [15, 15, 15, 15, 15], "ratio": {"armor": 0.1}, "range": 0}, "E": {"name": "Carga de Forja", "type": "Embestida", "desc": "Embiste hacia delante y empuja al primer enemigo 250 u.", "cooldown": [14, 13, 12, 11, 10], "cost": 70, "base": [60, 95, 130, 165, 200], "ratio": {"hp_bonus": 0.04}, "range": 450}, "R": {"name": "Ruptura de la Montaña", "type": "Área", "desc": "Tras 0,75 s levanta 3 pilares en un área: derriba 1,25 s y bloquea el paso 3 s.", "cooldown": [130, 115, 100], "cost": 100, "base": [150, 250, 350], "ratio": {"ap": 0.6}, "range": 700}}, {"id": "morgra", "name": "Morgra", "title": "Madre de la Horda", "tipoAtaque": "melee", "arma": "Tótem-maza de guerra", "cuerpo": "Orca corpulenta (2,4 m), piel verde, tótem ancestral en el pecho", "color": "#8bc34a", "clase": "Tanque", "raza": "Orco", "rol": "Jungla", "faccion": "Horda de Colmillo Rojo", "recurso": "Furia", "dificultad": 2, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "glifo", "color": "#8bc34a", "name": "Tótem de Rugido"}, "W": {"kind": "aura", "color": "#8bc34a", "name": "Piel Tatuada"}, "E": {"kind": "estela", "color": "#8bc34a", "name": "Garra del Jabalí"}, "R": {"kind": "estela", "color": "#8bc34a", "name": "Estampida de la Horda"}}, "death": {"kind": "fragmentos", "color": "#8bc34a"}}, "aspectos": [{"id": "base", "nombre": "Madre de la Horda", "modelo": "champ_morgra"}], "lore": "Chamana de guerra que lleva en el pecho el tótem de sus antepasados.", "pasiva": {"name": "Sangre Ancestral", "desc": "Por debajo del 40% de vida gana 30% de tenacidad y 2% de vida máx. por segundo durante 3 s (CD 60 s)."}, "Q": {"name": "Tótem de Rugido", "type": "Área", "desc": "Planta un tótem que provoca a los enemigos cercanos durante 1 s.", "cooldown": [12, 11, 10, 9, 8], "cost": 0, "base": [60, 90, 120, 150, 180], "ratio": {"ap": 0.5}, "range": 350}, "W": {"name": "Piel Tatuada", "type": "Autobuff", "desc": "Reduce el daño recibido 15/18/21/24/27% durante 3 s.", "cooldown": [16, 15, 14, 13, 12], "cost": 0, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 0}, "E": {"name": "Garra del Jabalí", "type": "Objetivo", "desc": "Golpe que inflige daño y gana 30% vel. movimiento hacia campeones.", "cooldown": [8, 7.5, 7, 6.5, 6], "cost": 0, "base": [50, 80, 110, 140, 170], "ratio": {"hp_bonus": 0.05}, "range": 200}, "R": {"name": "Estampida de la Horda", "type": "Embestida", "desc": "Invoca espíritus de jabalí que cargan en línea, lanzan por los aires 1 s y la acompañan.", "cooldown": [120, 105, 90], "cost": 0, "base": [200, 300, 400], "ratio": {"ap": 0.8}, "range": 1000}}, {"id": "ossuar", "name": "Ossuar", "title": "Osario Errante", "tipoAtaque": "melee", "arma": "Costilla-garfio y escudo de cráneos", "cuerpo": "Gólem de huesos (2,7 m), hombros de calaveras, columna visible", "color": "#b0bec5", "clase": "Tanque", "raza": "No-muerto", "rol": "Soporte", "faccion": "Reino Velado", "recurso": "Maná", "dificultad": 2, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "proyectil", "color": "#b0bec5", "name": "Garfio de Costillas"}, "W": {"kind": "aura", "color": "#b0bec5", "name": "Coraza de Hueso"}, "E": {"kind": "glifo", "color": "#b0bec5", "name": "Tumba Abierta"}, "R": {"kind": "glifo", "color": "#b0bec5", "name": "Cripta Sellada"}}, "death": {"kind": "fragmentos", "color": "#b0bec5"}}, "aspectos": [{"id": "base", "nombre": "Osario Errante", "modelo": "champ_ossuar"}], "lore": "Gólem de huesos de mil guerreros caídos que busca descanso para cada uno de ellos.", "pasiva": {"name": "Cosecha Ósea", "desc": "Cuando muere una unidad enemiga cercana obtiene 1 hueso (máx. 30): +1 armadura y RM por hueso."}, "Q": {"name": "Garfio de Costillas", "type": "Proyectil", "desc": "Lanza una costilla que atrae al primer enemigo hacia Ossuar.", "cooldown": [18, 16, 14, 12, 10], "cost": 80, "base": [80, 130, 180, 230, 280], "ratio": {"ap": 0.5}, "range": 1000}, "W": {"name": "Coraza de Hueso", "type": "Escudo aliado", "desc": "Escuda a un aliado por 60/90/120/150/180 (+10% vida bonus).", "cooldown": [14, 13, 12, 11, 10], "cost": 60, "base": [60, 90, 120, 150, 180], "ratio": {"hp_bonus": 0.1}, "range": 600}, "E": {"name": "Tumba Abierta", "type": "Área", "desc": "Crea un área que inmoviliza 1 s tras 0,5 s de retraso.", "cooldown": [14, 13, 12, 11, 10], "cost": 70, "base": [50, 85, 120, 155, 190], "ratio": {"ap": 0.4}, "range": 650}, "R": {"name": "Cripta Sellada", "type": "Área", "desc": "Encierra un área de 400 u. durante 2,5 s: nadie entra ni sale.", "cooldown": [140, 120, 100], "cost": 100, "base": [0, 0, 0], "ratio": {}, "range": 700}}, {"id": "kaelith", "name": "Kaelith", "title": "Filo del Alba", "tipoAtaque": "melee", "arma": "Espada larga y escudo del sol partido", "cuerpo": "Humana atlética (2,2 m), armadura dorada con capa rota", "color": "#ffe082", "clase": "Luchador", "raza": "Humano", "rol": "Top", "faccion": "Orden del Sol Partido", "recurso": "Maná", "dificultad": 2, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "estela", "color": "#ffe082", "name": "Corte Solar"}, "W": {"kind": "aura", "color": "#ffe082", "name": "Égida"}, "E": {"kind": "estela", "color": "#ffe082", "name": "Paso del Juicio"}, "R": {"kind": "estela", "color": "#ffe082", "name": "Sentencia del Alba"}}, "death": {"kind": "fragmentos", "color": "#ffe082"}}, "aspectos": [{"id": "base", "nombre": "Filo del Alba", "modelo": "champ_kaelith"}], "lore": "Paladina expulsada de su orden por negarse a quemar una aldea; ahora juzga con su propia espada.", "pasiva": {"name": "Juramento Roto", "desc": "Cada 3er ataque inflige 4% de vida máx. del objetivo como daño verdadero."}, "Q": {"name": "Corte Solar", "type": "Línea", "desc": "Tajo frontal; si golpea a un campeón, se puede relanzar una vez.", "cooldown": [8, 7.5, 7, 6.5, 6], "cost": 40, "base": [40, 70, 100, 130, 160], "ratio": {"ad": 0.75}, "range": 300}, "W": {"name": "Égida", "type": "Autobuff", "desc": "Bloquea el siguiente hechizo o ataque básico de campeón (1,5 s).", "cooldown": [18, 16, 14, 12, 10], "cost": 60, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 0}, "E": {"name": "Paso del Juicio", "type": "Desplazamiento", "desc": "Avanza 350 u.; el siguiente ataque aturde 0,75 s.", "cooldown": [13, 12, 11, 10, 9], "cost": 50, "base": [50, 75, 100, 125, 150], "ratio": {"ad": 0.5}, "range": 350}, "R": {"name": "Sentencia del Alba", "type": "Objetivo", "desc": "Salta sobre un campeón; daño aumentado en un 1% por cada 1% de vida que le falte.", "cooldown": [100, 85, 70], "cost": 100, "base": [150, 275, 400], "ratio": {"ad_bonus": 1.0}, "range": 600}}, {"id": "tharok", "name": "Tharok", "title": "Hacha del Norte", "tipoAtaque": "melee", "arma": "Hacha de arena a dos manos", "cuerpo": "Orco de arena (2,4 m), cicatrices, hombreras de hueso", "color": "#ef5350", "clase": "Luchador", "raza": "Orco", "rol": "Jungla", "faccion": "Horda de Colmillo Rojo", "recurso": "Furia", "dificultad": 1, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "glifo", "color": "#ef5350", "name": "Torbellino"}, "W": {"kind": "glifo", "color": "#ef5350", "name": "Grito de Guerra"}, "E": {"kind": "estela", "color": "#ef5350", "name": "Salto Brutal"}, "R": {"kind": "aura", "color": "#ef5350", "name": "Ira Indomable"}}, "death": {"kind": "fragmentos", "color": "#ef5350"}}, "aspectos": [{"id": "base", "nombre": "Hacha del Norte", "modelo": "champ_tharok"}], "lore": "El campeón de arena más temido de la Horda. Nunca ha perdido un combate a hachazos.", "pasiva": {"name": "Frenesí", "desc": "Cada ataque da 8% de vel. ataque durante 4 s (acumula 5 veces)."}, "Q": {"name": "Torbellino", "type": "Área", "desc": "Gira durante 1,5 s dañando a su alrededor; se cura un 30% del daño a campeones.", "cooldown": [10, 9, 8, 7, 6], "cost": 0, "base": [90, 140, 190, 240, 290], "ratio": {"ad": 1.0}, "range": 250}, "W": {"name": "Grito de Guerra", "type": "Área", "desc": "Reduce el daño de los enemigos cercanos un 20% durante 3 s.", "cooldown": [16, 15, 14, 13, 12], "cost": 0, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 400}, "E": {"name": "Salto Brutal", "type": "Desplazamiento", "desc": "Salta a una zona y ralentiza un 50% 1 s.", "cooldown": [14, 13, 12, 11, 10], "cost": 0, "base": [60, 95, 130, 165, 200], "ratio": {"ad_bonus": 0.6}, "range": 600}, "R": {"name": "Ira Indomable", "type": "Autobuff", "desc": "Durante 5 s su vida no baja de 1.", "cooldown": [110, 95, 80], "cost": 0, "base": [0, 0, 0], "ratio": {}, "range": 0}}, {"id": "yssra", "name": "Yssra", "title": "Reina de las Mareas", "tipoAtaque": "melee", "arma": "Tridente de coral", "cuerpo": "Sirénida bípeda (2,2 m), escamas turquesa, aletas en los antebrazos", "color": "#26c6da", "clase": "Luchador", "raza": "Sirénida", "rol": "Mid / Top", "faccion": "Abismo de Coral", "recurso": "Maná", "dificultad": 3, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "estela", "color": "#26c6da", "name": "Tridente"}, "W": {"kind": "aura", "color": "#26c6da", "name": "Burbuja"}, "E": {"kind": "estela", "color": "#26c6da", "name": "Ola Rompiente"}, "R": {"kind": "glifo", "color": "#26c6da", "name": "Maremoto"}}, "death": {"kind": "fragmentos", "color": "#26c6da"}}, "aspectos": [{"id": "base", "nombre": "Reina de las Mareas", "modelo": "champ_yssra"}], "lore": "Heredera del trono sumergido, sube a la superficie para reclamar las costas robadas.", "pasiva": {"name": "Corriente", "desc": "Las habilidades dejan un charco 3 s; dentro, Yssra gana 20% vel. movimiento y 10 de regeneración."}, "Q": {"name": "Tridente", "type": "Línea", "desc": "Estocada de 2 golpes: el 1º físico, el 2º mágico.", "cooldown": [7, 6.5, 6, 5.5, 5], "cost": 45, "base": [45, 70, 95, 120, 145], "ratio": {"ad": 0.5, "ap": 0.5}, "range": 475}, "W": {"name": "Burbuja", "type": "Escudo", "desc": "Escudo de 70-230 que ralentiza a los atacantes un 30%.", "cooldown": [15, 14, 13, 12, 11], "cost": 70, "base": [70, 110, 150, 190, 230], "ratio": {"ap": 0.4}, "range": 0}, "E": {"name": "Ola Rompiente", "type": "Desplazamiento", "desc": "Surfea 500 u. y lanza por los aires 0,5 s a los enemigos que atraviesa.", "cooldown": [16, 15, 14, 13, 12], "cost": 60, "base": [60, 90, 120, 150, 180], "ratio": {"ap": 0.6}, "range": 500}, "R": {"name": "Maremoto", "type": "Área", "desc": "Inunda un área enorme: daña, ralentiza un 60% y toda el área cuenta como charco.", "cooldown": [120, 110, 100], "cost": 100, "base": [200, 325, 450], "ratio": {"ap": 0.75, "ad_bonus": 0.5}, "range": 900}}, {"id": "vaelor", "name": "Vaelor", "title": "Archimago de Ceniza", "tipoAtaque": "magic", "arma": "Bastón de ceniza con brasa", "cuerpo": "Elfo alto y delgado (2,2 m), túnica gris quemada, ojos de brasa", "color": "#ff7043", "clase": "Mago", "raza": "Elfo de Ceniza", "rol": "Mid", "faccion": "Concilio de la Torre Gris", "recurso": "Maná", "dificultad": 2, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "proyectil", "color": "#ff7043", "name": "Lanza Ígnea"}, "W": {"kind": "muro", "color": "#ff7043", "name": "Muro de Ceniza"}, "E": {"kind": "glifo", "color": "#ff7043", "name": "Combustión"}, "R": {"kind": "glifo", "color": "#ff7043", "name": "Lluvia de Meteoros"}}, "death": {"kind": "fragmentos", "color": "#ff7043"}}, "aspectos": [{"id": "base", "nombre": "Archimago de Ceniza", "modelo": "champ_vaelor"}], "lore": "Último superviviente de la ciudad élfica que él mismo calcinó al perder el control de su magia.", "pasiva": {"name": "Rescoldo", "desc": "Las habilidades queman al objetivo un 2% de su vida máx. durante 3 s."}, "Q": {"name": "Lanza Ígnea", "type": "Proyectil", "desc": "Proyectil que daña al primer enemigo y explota en un área pequeña.", "cooldown": [6, 5.5, 5, 4.5, 4], "cost": 55, "base": [80, 120, 160, 200, 240], "ratio": {"ap": 0.7}, "range": 900}, "W": {"name": "Muro de Ceniza", "type": "Muro", "desc": "Crea un muro de fuego de 600 u. durante 3 s; ralentiza un 40%.", "cooldown": [18, 17, 16, 15, 14], "cost": 80, "base": [60, 95, 130, 165, 200], "ratio": {"ap": 0.4}, "range": 800}, "E": {"name": "Combustión", "type": "Objetivo", "desc": "Detona las quemaduras del objetivo; si estaba quemándose, aturde 1,25 s.", "cooldown": [12, 11, 10, 9, 8], "cost": 70, "base": [70, 105, 140, 175, 210], "ratio": {"ap": 0.6}, "range": 650}, "R": {"name": "Lluvia de Meteoros", "type": "Área", "desc": "Canaliza 2 s: cae un meteoro cada 0,4 s en el área.", "cooldown": [110, 95, 80], "cost": 100, "base": [300, 450, 600], "ratio": {"ap": 1.2}, "range": 1300}}, {"id": "nyxe", "name": "Nyxe", "title": "Tejesueños", "tipoAtaque": "magic", "arma": "Varita de polvo de hada", "cuerpo": "Hada menuda (1,7 m), alas de mariposa translúcidas, flota a un palmo del suelo", "color": "#ea80fc", "clase": "Mago", "raza": "Feérico", "rol": "Mid / Soporte", "faccion": "Bosque Onírico", "recurso": "Maná", "dificultad": 3, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "proyectil", "color": "#ea80fc", "name": "Mariposas Oníricas"}, "W": {"kind": "glifo", "color": "#ea80fc", "name": "Somnolencia"}, "E": {"kind": "estela", "color": "#ea80fc", "name": "Paso Fae"}, "R": {"kind": "glifo", "color": "#ea80fc", "name": "Pesadilla Compartida"}}, "death": {"kind": "fragmentos", "color": "#ea80fc"}}, "aspectos": [{"id": "base", "nombre": "Tejesueños", "modelo": "champ_nyxe"}], "lore": "Hada que roba pesadillas a los niños... y a veces se las devuelve a los adultos.", "pasiva": {"name": "Polvo de Hada", "desc": "Cada 4ª habilidad lanzada es gratuita y gana 50 de alcance."}, "Q": {"name": "Mariposas Oníricas", "type": "Proyectil", "desc": "Lanza 3 mariposas que persiguen al enemigo más cercano.", "cooldown": [7, 6.5, 6, 5.5, 5], "cost": 60, "base": [30, 45, 60, 75, 90], "ratio": {"ap": 0.3}, "range": 700}, "W": {"name": "Somnolencia", "type": "Área", "desc": "Tras 1,5 s duerme 1,5 s a los enemigos del área (el daño despierta).", "cooldown": [16, 15, 14, 13, 12], "cost": 80, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 800}, "E": {"name": "Paso Fae", "type": "Desplazamiento", "desc": "Parpadea 400 u. y se vuelve invisible 1 s.", "cooldown": [18, 16, 14, 12, 10], "cost": 60, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 400}, "R": {"name": "Pesadilla Compartida", "type": "Objetivo", "desc": "Encierra a un campeón 2 s en un sueño: no ve a nadie; al salir sufre daño.", "cooldown": [120, 100, 80], "cost": 100, "base": [200, 300, 400], "ratio": {"ap": 0.8}, "range": 700}}, {"id": "zerath", "name": "Zerath", "title": "El Hambre Profunda", "tipoAtaque": "magic", "arma": "Garras del vacío (sin arma)", "cuerpo": "Silueta humanoide hecha de vacío (2,3 m), bordes que se deshacen en humo", "color": "#7c4dff", "clase": "Mago", "raza": "Espíritu del Vacío", "rol": "Mid / Top", "faccion": "La Grieta", "recurso": "Ninguno (vida)", "dificultad": 3, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "glifo", "color": "#7c4dff", "name": "Mano del Vacío"}, "W": {"kind": "rayo", "color": "#7c4dff", "name": "Absorber"}, "E": {"kind": "aura", "color": "#7c4dff", "name": "Fase"}, "R": {"kind": "glifo", "color": "#7c4dff", "name": "Singularidad"}}, "death": {"kind": "fragmentos", "color": "#7c4dff"}}, "aspectos": [{"id": "base", "nombre": "El Hambre Profunda", "modelo": "champ_zerath"}], "lore": "Fragmento consciente del vacío que aprendió a imitar la forma humana devorando recuerdos.", "pasiva": {"name": "Devorar", "desc": "Las habilidades cuestan 5% de vida actual; cada asesinato o asistencia da +5 PH permanente."}, "Q": {"name": "Mano del Vacío", "type": "Área", "desc": "Tras 0,5 s, garras emergen del suelo y ralentizan un 60%.", "cooldown": [8, 7.5, 7, 6.5, 6], "cost": 0, "base": [70, 110, 150, 190, 230], "ratio": {"ap": 0.6}, "range": 800}, "W": {"name": "Absorber", "type": "Drenaje", "desc": "Canaliza 3 s sobre un objetivo: daño por segundo y se cura el 60%.", "cooldown": [14, 13, 12, 11, 10], "cost": 0, "base": [40, 60, 80, 100, 120], "ratio": {"ap": 0.25}, "range": 500}, "E": {"name": "Fase", "type": "Autobuff", "desc": "Se vuelve inalcanzable 1 s.", "cooldown": [22, 20, 18, 16, 14], "cost": 0, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 0}, "R": {"name": "Singularidad", "type": "Área", "desc": "Crea un agujero negro de 2,5 s que atrae continuamente al centro.", "cooldown": [130, 115, 100], "cost": 0, "base": [250, 375, 500], "ratio": {"ap": 0.9}, "range": 750}}, {"id": "lyra", "name": "Lyra Vientoalto", "title": "Flecha del Cielo", "tipoAtaque": "ranged", "arma": "Arco largo élfico", "cuerpo": "Elfa esbelta (2,2 m), capa de hojas, carcaj a la espalda", "color": "#aed581", "clase": "Tirador", "raza": "Elfo Silvano", "rol": "Carril inferior (tirador)", "faccion": "Bosque Onírico", "recurso": "Maná", "dificultad": 1, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "estela", "color": "#aed581", "name": "Flecha Perforante"}, "W": {"kind": "glifo", "color": "#aed581", "name": "Lluvia de Flechas"}, "E": {"kind": "estela", "color": "#aed581", "name": "Voltereta"}, "R": {"kind": "proyectil", "color": "#aed581", "name": "Saeta Celeste"}}, "death": {"kind": "fragmentos", "color": "#aed581"}}, "aspectos": [{"id": "base", "nombre": "Flecha del Cielo", "modelo": "champ_lyra"}], "lore": "Exploradora élfica capaz de acertar a un halcón en vuelo a un kilómetro de distancia.", "pasiva": {"name": "Ojo de Halcón", "desc": "Atacar al mismo objetivo 3 veces seguidas da 30% de vel. ataque durante 3 s."}, "Q": {"name": "Flecha Perforante", "type": "Línea", "desc": "Disparo cargado que atraviesa a todos los enemigos (-10% daño por objetivo).", "cooldown": [9, 8, 7, 6, 5], "cost": 50, "base": [40, 75, 110, 145, 180], "ratio": {"ad": 1.1}, "range": 1100}, "W": {"name": "Lluvia de Flechas", "type": "Área", "desc": "Ralentiza un 30% y daña en un área circular.", "cooldown": [14, 13, 12, 11, 10], "cost": 70, "base": [60, 95, 130, 165, 200], "ratio": {"ad_bonus": 0.6}, "range": 900}, "E": {"name": "Voltereta", "type": "Desplazamiento", "desc": "Rueda 300 u.; el siguiente ataque tiene +100 de alcance.", "cooldown": [12, 11, 10, 9, 8], "cost": 40, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 300}, "R": {"name": "Saeta Celeste", "type": "Proyectil global", "desc": "Flecha que cruza el mapa; aturde según la distancia (1-3,5 s).", "cooldown": [100, 90, 80], "cost": 100, "base": [200, 325, 450], "ratio": {"ap": 1.0}, "range": 99999}}, {"id": "gearix", "name": "Gearix", "title": "Ingeniera Loca", "tipoAtaque": "ranged", "arma": "Escopeta-cañón de seis balas", "cuerpo": "Gnoma pequeña (1,7 m) con mochila mecánica y gafas de soldar", "color": "#ffd54f", "clase": "Tirador", "raza": "Gnomo", "rol": "Carril inferior (tirador)", "faccion": "Consorcio de Engranajes", "recurso": "Munición (6 balas)", "dificultad": 2, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "glifo", "color": "#ffd54f", "name": "Torreta Portátil"}, "W": {"kind": "glifo", "color": "#ffd54f", "name": "Granada de Humo"}, "E": {"kind": "estela", "color": "#ffd54f", "name": "Retroceso"}, "R": {"kind": "estela", "color": "#ffd54f", "name": "Gran Cañón"}}, "death": {"kind": "fragmentos", "color": "#ffd54f"}}, "aspectos": [{"id": "base", "nombre": "Ingeniera Loca", "modelo": "champ_gearix"}], "lore": "Genio expulsada de cuatro academias por 'exceso de explosiones'. Le parece una crítica injusta.", "pasiva": {"name": "Cargador", "desc": "Cada 6º ataque es un disparo de escopeta en cono con 150% de daño."}, "Q": {"name": "Torreta Portátil", "type": "Invocación", "desc": "Despliega una torreta (máx. 2) que ataca 8 s.", "cooldown": [12, 11, 10, 9, 8], "cost": 0, "base": [20, 30, 40, 50, 60], "ratio": {"ad": 0.3}, "range": 500}, "W": {"name": "Granada de Humo", "type": "Área", "desc": "Ciega a los enemigos del área 1,5 s (sus ataques fallan).", "cooldown": [16, 15, 14, 13, 12], "cost": 0, "base": [50, 80, 110, 140, 170], "ratio": {"ap": 0.5}, "range": 700}, "E": {"name": "Retroceso", "type": "Desplazamiento", "desc": "Dispara hacia delante y sale despedida 400 u. hacia atrás.", "cooldown": [16, 14, 12, 10, 8], "cost": 0, "base": [40, 70, 100, 130, 160], "ratio": {"ad_bonus": 0.5}, "range": 400}, "R": {"name": "Gran Cañón", "type": "Línea", "desc": "Tras 1 s de carga, rayo que daña un 50% más a objetivos con poca vida.", "cooldown": [90, 75, 60], "cost": 0, "base": [250, 400, 550], "ratio": {"ad_bonus": 1.5}, "range": 1500}}, {"id": "sable", "name": "Sable", "title": "La Sombra sin Nombre", "tipoAtaque": "melee", "arma": "Dagas gemelas", "cuerpo": "Humana enjuta (2,2 m), capucha y velo, sin rostro visible", "color": "#90a4ae", "clase": "Asesino", "raza": "Humano", "rol": "Mid / Jungla", "faccion": "Hermandad del Velo", "recurso": "Energía", "dificultad": 3, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "proyectil", "color": "#90a4ae", "name": "Daga Sombría"}, "W": {"kind": "humo", "color": "#90a4ae", "name": "Velo"}, "E": {"kind": "glifo", "color": "#90a4ae", "name": "Abanico de Cuchillas"}, "R": {"kind": "estela", "color": "#90a4ae", "name": "Ejecución"}}, "death": {"kind": "fragmentos", "color": "#90a4ae"}}, "aspectos": [{"id": "base", "nombre": "La Sombra sin Nombre", "modelo": "champ_sable"}], "lore": "Nadie conoce su verdadero nombre, ni siquiera la Hermandad que la entrenó.", "pasiva": {"name": "Marca Mortal", "desc": "Golpear a un campeón aislado (sin aliados en 600 u.) inflige un 25% de daño extra."}, "Q": {"name": "Daga Sombría", "type": "Proyectil", "desc": "Lanza una daga; si impacta, puede teletransportarse detrás del objetivo.", "cooldown": [8, 7.5, 7, 6.5, 6], "cost": 50, "base": [60, 95, 130, 165, 200], "ratio": {"ad_bonus": 0.8}, "range": 700}, "W": {"name": "Velo", "type": "Sigilo", "desc": "Invisible 2 s y +20% vel. movimiento.", "cooldown": [20, 18, 16, 14, 12], "cost": 60, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 0}, "E": {"name": "Abanico de Cuchillas", "type": "Área", "desc": "Cuchillas a su alrededor; ralentizan un 30%.", "cooldown": [6, 5.5, 5, 4.5, 4], "cost": 40, "base": [50, 75, 100, 125, 150], "ratio": {"ad_bonus": 0.6}, "range": 300}, "R": {"name": "Ejecución", "type": "Objetivo", "desc": "Marca a un campeón; tras 3 s la marca explota con el 30% del daño infligido.", "cooldown": [90, 75, 60], "cost": 0, "base": [100, 175, 250], "ratio": {"ad_bonus": 1.0}, "range": 625}}, {"id": "rakhar", "name": "Rakhar", "title": "Garra Escarlata", "tipoAtaque": "melee", "arma": "Garras escarlatas", "cuerpo": "Bestial cuadrúpedo-bípedo (2,0 m), lomo arqueado, cola larga", "color": "#ff5722", "clase": "Asesino", "raza": "Bestial (felino)", "rol": "Jungla", "faccion": "Tribus de las Dunas", "recurso": "Ninguno", "dificultad": 2, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "estela", "color": "#ff5722", "name": "Zarpazo"}, "W": {"kind": "glifo", "color": "#ff5722", "name": "Rugido"}, "E": {"kind": "estela", "color": "#ff5722", "name": "Abalanzarse"}, "R": {"kind": "aura", "color": "#ff5722", "name": "Cacería"}}, "death": {"kind": "fragmentos", "color": "#ff5722"}}, "aspectos": [{"id": "felino", "nombre": "Garra Escarlata (felino)", "modelo": "champ_rakhar"}, {"id": "lagarto", "nombre": "Garra Escarlata (lagarto)", "modelo": "champ_rakhar_lagarto"}], "lore": "Cazador del desierto que prefiere presas que puedan defenderse.", "pasiva": {"name": "Instinto de Caza", "desc": "Ve a los campeones enemigos por debajo del 50% de vida a 1500 u. y gana 15% vel. movimiento hacia ellos."}, "Q": {"name": "Zarpazo", "type": "Objetivo", "desc": "3 zarpazos rápidos; el 3º inflige el doble.", "cooldown": [7, 6.5, 6, 5.5, 5], "cost": 0, "base": [30, 45, 60, 75, 90], "ratio": {"ad_bonus": 0.5}, "range": 175}, "W": {"name": "Rugido", "type": "Área", "desc": "Asusta 0,75 s a los enemigos cercanos.", "cooldown": [18, 17, 16, 15, 14], "cost": 0, "base": [40, 65, 90, 115, 140], "ratio": {"ad_bonus": 0.4}, "range": 325}, "E": {"name": "Abalanzarse", "type": "Desplazamiento", "desc": "Salta sobre un objetivo; se reinicia con asesinatos o asistencias.", "cooldown": [12, 11, 10, 9, 8], "cost": 0, "base": [60, 90, 120, 150, 180], "ratio": {"ad_bonus": 0.7}, "range": 650}, "R": {"name": "Cacería", "type": "Autobuff", "desc": "6 s: +40% vel. movimiento, se vuelve invisible fuera de combate y su próximo ataque es crítico.", "cooldown": [100, 85, 70], "cost": 0, "base": [0, 0, 0], "ratio": {}, "range": 0}}, {"id": "elowen", "name": "Elowen", "title": "Voz del Bosque", "tipoAtaque": "magic", "arma": "Rama viva (báculo que florece)", "cuerpo": "Dríade (2,1 m), piel de corteza, cabello de hojas y flores", "color": "#66bb6a", "clase": "Soporte", "raza": "Dríade", "rol": "Soporte", "faccion": "Bosque Onírico", "recurso": "Maná", "dificultad": 1, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "proyectil", "color": "#66bb6a", "name": "Raíces Atadoras"}, "W": {"kind": "cura", "color": "#66bb6a", "name": "Savia Vital"}, "E": {"kind": "aura", "color": "#66bb6a", "name": "Corteza"}, "R": {"kind": "glifo", "color": "#66bb6a", "name": "Renacer del Bosque"}}, "death": {"kind": "fragmentos", "color": "#66bb6a"}}, "aspectos": [{"id": "base", "nombre": "Voz del Bosque", "modelo": "champ_elowen"}], "lore": "Espíritu del roble más antiguo, despertado para curar la tierra herida por la guerra.", "pasiva": {"name": "Florecer", "desc": "Las curaciones dejan una flor que da 15 de vida extra al aliado que la pisa."}, "Q": {"name": "Raíces Atadoras", "type": "Proyectil", "desc": "Inmoviliza 1,25 s al primer enemigo.", "cooldown": [13, 12, 11, 10, 9], "cost": 60, "base": [70, 110, 150, 190, 230], "ratio": {"ap": 0.5}, "range": 1000}, "W": {"name": "Savia Vital", "type": "Curación", "desc": "Cura a un aliado y a sí misma 70-230 (+35% PH).", "cooldown": [10, 9.5, 9, 8.5, 8], "cost": 80, "base": [70, 110, 150, 190, 230], "ratio": {"ap": 0.35}, "range": 700}, "E": {"name": "Corteza", "type": "Escudo aliado", "desc": "El aliado gana 20 de armadura y RM y su próximo ataque inmoviliza.", "cooldown": [14, 13, 12, 11, 10], "cost": 60, "base": [0, 0, 0, 0, 0], "ratio": {}, "range": 700}, "R": {"name": "Renacer del Bosque", "type": "Área aliada", "desc": "Gran área de curación durante 3 s; los aliados que mueran en ella reviven con un 20% de vida (1 vez).", "cooldown": [160, 140, 120], "cost": 100, "base": [150, 250, 350], "ratio": {"ap": 0.6}, "range": 900}}, {"id": "aurik", "name": "Aurik", "title": "Heraldo Dorado", "tipoAtaque": "magic", "arma": "Lanza-estandarte dorada", "cuerpo": "Dracónido (2,3 m), escamas doradas, alas plegadas, cuernos cortos", "color": "#ffca28", "clase": "Soporte", "raza": "Dracónido", "rol": "Soporte", "faccion": "Orden del Sol Partido", "recurso": "Maná", "dificultad": 2, "anims": {"Idle": "Idle", "Run": "Run", "Attack": "Attack", "Cast": "Cast", "Death": "Death", "Cast_Q": "Cast_Q", "Cast_W": "Cast_W", "Cast_E": "Cast_E", "Cast_R": "Cast_R"}, "animsOpcionales": ["Cast_Q", "Cast_W", "Cast_E", "Cast_R"], "vfx": {"spawn": {"kind": "columna", "color": "equipo"}, "cast": {"Q": {"kind": "cono", "color": "#ffca28", "name": "Aliento Solar"}, "W": {"kind": "estela", "color": "#ffca28", "name": "Ala Protectora"}, "E": {"kind": "glifo", "color": "#ffca28", "name": "Rugido Dracónico"}, "R": {"kind": "aura", "color": "#ffca28", "name": "Forma Dragón"}}, "death": {"kind": "fragmentos", "color": "#ffca28"}}, "aspectos": [{"id": "base", "nombre": "Heraldo Dorado", "modelo": "champ_aurik"}], "lore": "Dragón joven que adoptó forma humanoide para servir a la orden que salvó su huevo.", "pasiva": {"name": "Escamas de Oro", "desc": "Los aliados cercanos ganan 5 de armadura; el doble si Aurik está en forma de dragón."}, "Q": {"name": "Aliento Solar", "type": "Cono", "desc": "Cono de fuego dorado que ralentiza un 30%.", "cooldown": [9, 8.5, 8, 7.5, 7], "cost": 60, "base": [60, 95, 130, 165, 200], "ratio": {"ap": 0.5}, "range": 550}, "W": {"name": "Ala Protectora", "type": "Desplazamiento aliado", "desc": "Vuela hacia un aliado y ambos ganan un escudo de 60-200.", "cooldown": [16, 15, 14, 13, 12], "cost": 70, "base": [60, 95, 130, 165, 200], "ratio": {"ap": 0.3}, "range": 800}, "E": {"name": "Rugido Dracónico", "type": "Área", "desc": "Aturde 0,75 s a los enemigos cercanos.", "cooldown": [16, 15, 14, 13, 12], "cost": 70, "base": [50, 80, 110, 140, 170], "ratio": {"ap": 0.4}, "range": 300}, "R": {"name": "Forma Dragón", "type": "Transformación", "desc": "8 s: vuela (ignora terreno), +300 de vida y su Q pasa a ser una línea de 900 u.", "cooldown": [140, 120, 100], "cost": 100, "base": [100, 150, 200], "ratio": {"ap": 0.3}, "range": 0}}];
