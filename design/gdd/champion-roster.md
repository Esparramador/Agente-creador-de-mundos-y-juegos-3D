# Plantel de campeones — Coronas de Ceniza (demo)

> Documento GENERADO por `tools/build_design.py` a partir de `tools/champions_src.py`. No lo edites a mano.

## Overview
15 campeones originales que cubren las 6 clases, 10 razas y 9 facciones. Cada uno tiene una pasiva, 4 habilidades (Q/W/E con 5 rangos, R con 3), estadísticas de nivel 1 y crecimiento por nivel.

## Player Fantasy
Que cada jugador encuentre su campeón: el muro inamovible, la asesina en la sombra, el arquero preciso o la curandera que salva la pelea.

## Resumen

| # | Campeón | Título | Raza | Facción | Clase | Rol | Daño | Recurso | Dif. | Vida N1/N18 | AD N1 | Alcance | Combo N9* |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Brannoc** | El Yunque Viviente | Enano | Clanes de Hondaforja | Tanque | Top / Soporte | Físico | Maná | ★ | 690/2560 | 62 | 125 | 596 |
| 2 | **Morgra** | Madre de la Horda | Orco | Horda de Colmillo Rojo | Tanque | Jungla | Mágico | Furia | ★★ | 670/2540 | 65 | 125 | 530 |
| 3 | **Ossuar** | Osario Errante | No-muerto | Reino Velado | Tanque | Soporte | Mágico | Maná | ★★ | 650/2520 | 62 | 125 | 420 |
| 4 | **Kaelith** | Filo del Alba | Humano | Orden del Sol Partido | Luchador | Top | Físico | Maná | ★★ | 620/2320 | 66 | 150 | 590 |
| 5 | **Tharok** | Hacha del Norte | Orco | Horda de Colmillo Rojo | Luchador | Jungla | Físico | Furia | ★ | 650/2350 | 66 | 150 | 412 |
| 6 | **Yssra** | Reina de las Mareas | Sirénida | Abismo de Coral | Luchador | Mid / Top | Mixto | Maná | ★★★ | 620/2320 | 66 | 150 | 736 |
| 7 | **Vaelor** | Archimago de Ceniza | Elfo de Ceniza | Concilio de la Torre Gris | Mago | Mid | Mágico | Maná | ★★ | 560/2124 | 52 | 525 | 880 |
| 8 | **Nyxe** | Tejesueños | Feérico | Bosque Onírico | Mago | Mid / Soporte | Mágico | Maná | ★★★ | 560/2124 | 52 | 525 | 360 |
| 9 | **Zerath** | El Hambre Profunda | Espíritu del Vacío | La Grieta | Mago | Mid / Top | Mágico | Ninguno (vida) | ★★★ | 620/2184 | 52 | 525 | 605 |
| 10 | **Lyra Vientoalto** | Flecha del Cielo | Elfo Silvano | Bosque Onírico | Tirador | Carril inferior (tirador) | Físico | Maná | ★ | 580/2212 | 60 | 600 | 650 |
| 11 | **Gearix** | Ingeniera Loca | Gnomo | Consorcio de Engranajes | Tirador | Carril inferior (tirador) | Físico | Munición (6 balas) | ★★ | 580/2212 | 62 | 575 | 674 |
| 12 | **Sable** | La Sombra sin Nombre | Humano | Hermandad del Velo | Asesino | Mid / Jungla | Físico | Energía | ★★★ | 590/2256 | 64 | 125 | 405 |
| 13 | **Rakhar** | Garra Escarlata | Bestial (felino) | Tribus de las Dunas | Asesino | Jungla | Físico | Ninguno | ★★ | 590/2256 | 66 | 125 | 270 |
| 14 | **Elowen** | Voz del Bosque | Dríade | Bosque Onírico | Soporte | Soporte | Mágico | Maná | ★ | 570/2168 | 50 | 550 | 550 |
| 15 | **Aurik** | Heraldo Dorado | Dracónido | Orden del Sol Partido | Soporte | Soporte | Mágico | Maná | ★★ | 600/2198 | 50 | 550 | 520 |

*Daño base de las 4 habilidades a nivel 9 sin objetos; es un indicador de equilibrio, no de DPS.

## Detailed Rules

### Brannoc, El Yunque Viviente
*Enano · Clanes de Hondaforja · Tanque · Top / Soporte*

> Herrero-guardián que se fundió a sí mismo con su yunque para cerrar la Puerta de Hondaforja.

**Estadísticas N1:** Vida 690 (+110) · AD 62 (+3.5) · Armadura 38 (+4.7) · RM 32 (+2.0) · Vel. ataque 0.625 (+1.5%) · Vel. mov. 335 · Alcance 125

**Pasiva — Piel de Yunque:** Cada 8 s gana un escudo del 8% de vida máx. que se refresca si no recibe daño en 4 s.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Martillazo Sísmico | Línea | Golpea el suelo; daña y ralentiza un 40% 1,5 s. | 70/110/150/190/230 | 60% AD | 9/8.5/8/7.5/7 | 50 | 600 |
| W | Templar Acero | Autobuff | +20/25/30/35/40 armadura y RM durante 4 s; refleja 15 de daño por golpe. | 15/15/15/15/15 | 10% ARMOR | 14/13/12/11/10 | 60 | 0 |
| E | Carga de Forja | Embestida | Embiste hacia delante y empuja al primer enemigo 250 u. | 60/95/130/165/200 | 4% HP_BONUS | 14/13/12/11/10 | 70 | 450 |
| R | Ruptura de la Montaña | Área | Tras 0,75 s levanta 3 pilares en un área: derriba 1,25 s y bloquea el paso 3 s. | 150/250/350 | 60% AP | 130/115/100 | 100 | 700 |

### Morgra, Madre de la Horda
*Orco · Horda de Colmillo Rojo · Tanque · Jungla*

> Chamana de guerra que lleva en el pecho el tótem de sus antepasados.

**Estadísticas N1:** Vida 670 (+110) · AD 65 (+3.5) · Armadura 36 (+4.7) · RM 32 (+2.0) · Vel. ataque 0.625 (+1.5%) · Vel. mov. 335 · Alcance 125

**Pasiva — Sangre Ancestral:** Por debajo del 40% de vida gana 30% de tenacidad y 2% de vida máx. por segundo durante 3 s (CD 60 s).

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Tótem de Rugido | Área | Planta un tótem que provoca a los enemigos cercanos durante 1 s. | 60/90/120/150/180 | 50% AP | 12/11/10/9/8 | — | 350 |
| W | Piel Tatuada | Autobuff | Reduce el daño recibido 15/18/21/24/27% durante 3 s. | 0/0/0/0/0 | — | 16/15/14/13/12 | — | 0 |
| E | Garra del Jabalí | Objetivo | Golpe que inflige daño y gana 30% vel. movimiento hacia campeones. | 50/80/110/140/170 | 5% HP_BONUS | 8/7.5/7/6.5/6 | — | 200 |
| R | Estampida de la Horda | Embestida | Invoca espíritus de jabalí que cargan en línea, lanzan por los aires 1 s y la acompañan. | 200/300/400 | 80% AP | 120/105/90 | — | 1000 |

### Ossuar, Osario Errante
*No-muerto · Reino Velado · Tanque · Soporte*

> Gólem de huesos de mil guerreros caídos que busca descanso para cada uno de ellos.

**Estadísticas N1:** Vida 650 (+110) · AD 62 (+3.5) · Armadura 36 (+4.7) · RM 36 (+2.0) · Vel. ataque 0.625 (+1.5%) · Vel. mov. 335 · Alcance 125

**Pasiva — Cosecha Ósea:** Cuando muere una unidad enemiga cercana obtiene 1 hueso (máx. 30): +1 armadura y RM por hueso.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Garfio de Costillas | Proyectil | Lanza una costilla que atrae al primer enemigo hacia Ossuar. | 80/130/180/230/280 | 50% AP | 18/16/14/12/10 | 80 | 1000 |
| W | Coraza de Hueso | Escudo aliado | Escuda a un aliado por 60/90/120/150/180 (+10% vida bonus). | 60/90/120/150/180 | 10% HP_BONUS | 14/13/12/11/10 | 60 | 600 |
| E | Tumba Abierta | Área | Crea un área que inmoviliza 1 s tras 0,5 s de retraso. | 50/85/120/155/190 | 40% AP | 14/13/12/11/10 | 70 | 650 |
| R | Cripta Sellada | Área | Encierra un área de 400 u. durante 2,5 s: nadie entra ni sale. | 0/0/0 | — | 140/120/100 | 100 | 700 |

### Kaelith, Filo del Alba
*Humano · Orden del Sol Partido · Luchador · Top*

> Paladina expulsada de su orden por negarse a quemar una aldea; ahora juzga con su propia espada.

**Estadísticas N1:** Vida 620 (+100) · AD 66 (+3.8) · Armadura 34 (+4.2) · RM 32 (+2.0) · Vel. ataque 0.65 (+2.5%) · Vel. mov. 345 · Alcance 150

**Pasiva — Juramento Roto:** Cada 3er ataque inflige 4% de vida máx. del objetivo como daño verdadero.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Corte Solar | Línea | Tajo frontal; si golpea a un campeón, se puede relanzar una vez. | 40/70/100/130/160 | 75% AD | 8/7.5/7/6.5/6 | 40 | 300 |
| W | Égida | Autobuff | Bloquea el siguiente hechizo o ataque básico de campeón (1,5 s). | 0/0/0/0/0 | — | 18/16/14/12/10 | 60 | 0 |
| E | Paso del Juicio | Desplazamiento | Avanza 350 u.; el siguiente ataque aturde 0,75 s. | 50/75/100/125/150 | 50% AD | 13/12/11/10/9 | 50 | 350 |
| R | Sentencia del Alba | Objetivo | Salta sobre un campeón; daño aumentado en un 1% por cada 1% de vida que le falte. | 150/275/400 | 100% AD_BONUS | 100/85/70 | 100 | 600 |

### Tharok, Hacha del Norte
*Orco · Horda de Colmillo Rojo · Luchador · Jungla*

> El campeón de arena más temido de la Horda. Nunca ha perdido un combate a hachazos.

**Estadísticas N1:** Vida 650 (+100) · AD 66 (+3.8) · Armadura 34 (+4.2) · RM 32 (+2.0) · Vel. ataque 0.65 (+2.5%) · Vel. mov. 345 · Alcance 150

**Pasiva — Frenesí:** Cada ataque da 8% de vel. ataque durante 4 s (acumula 5 veces).

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Torbellino | Área | Gira durante 1,5 s dañando a su alrededor; se cura un 30% del daño a campeones. | 90/140/190/240/290 | 100% AD | 10/9/8/7/6 | — | 250 |
| W | Grito de Guerra | Área | Reduce el daño de los enemigos cercanos un 20% durante 3 s. | 0/0/0/0/0 | — | 16/15/14/13/12 | — | 400 |
| E | Salto Brutal | Desplazamiento | Salta a una zona y ralentiza un 50% 1 s. | 60/95/130/165/200 | 60% AD_BONUS | 14/13/12/11/10 | — | 600 |
| R | Ira Indomable | Autobuff | Durante 5 s su vida no baja de 1. | 0/0/0 | — | 110/95/80 | — | 0 |

### Yssra, Reina de las Mareas
*Sirénida · Abismo de Coral · Luchador · Mid / Top*

> Heredera del trono sumergido, sube a la superficie para reclamar las costas robadas.

**Estadísticas N1:** Vida 620 (+100) · AD 66 (+3.8) · Armadura 34 (+4.2) · RM 32 (+2.0) · Vel. ataque 0.65 (+2.5%) · Vel. mov. 350 · Alcance 150

**Pasiva — Corriente:** Las habilidades dejan un charco 3 s; dentro, Yssra gana 20% vel. movimiento y 10 de regeneración.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Tridente | Línea | Estocada de 2 golpes: el 1º físico, el 2º mágico. | 45/70/95/120/145 | 50% AD, 50% AP | 7/6.5/6/5.5/5 | 45 | 475 |
| W | Burbuja | Escudo | Escudo de 70-230 que ralentiza a los atacantes un 30%. | 70/110/150/190/230 | 40% AP | 15/14/13/12/11 | 70 | 0 |
| E | Ola Rompiente | Desplazamiento | Surfea 500 u. y lanza por los aires 0,5 s a los enemigos que atraviesa. | 60/90/120/150/180 | 60% AP | 16/15/14/13/12 | 60 | 500 |
| R | Maremoto | Área | Inunda un área enorme: daña, ralentiza un 60% y toda el área cuenta como charco. | 200/325/450 | 75% AP, 50% AD_BONUS | 120/110/100 | 100 | 900 |

### Vaelor, Archimago de Ceniza
*Elfo de Ceniza · Concilio de la Torre Gris · Mago · Mid*

> Último superviviente de la ciudad élfica que él mismo calcinó al perder el control de su magia.

**Estadísticas N1:** Vida 560 (+92) · AD 52 (+3.0) · Armadura 22 (+4.2) · RM 30 (+1.3) · Vel. ataque 0.625 (+1.8%) · Vel. mov. 330 · Alcance 525

**Pasiva — Rescoldo:** Las habilidades queman al objetivo un 2% de su vida máx. durante 3 s.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Lanza Ígnea | Proyectil | Proyectil que daña al primer enemigo y explota en un área pequeña. | 80/120/160/200/240 | 70% AP | 6/5.5/5/4.5/4 | 55 | 900 |
| W | Muro de Ceniza | Muro | Crea un muro de fuego de 600 u. durante 3 s; ralentiza un 40%. | 60/95/130/165/200 | 40% AP | 18/17/16/15/14 | 80 | 800 |
| E | Combustión | Objetivo | Detona las quemaduras del objetivo; si estaba quemándose, aturde 1,25 s. | 70/105/140/175/210 | 60% AP | 12/11/10/9/8 | 70 | 650 |
| R | Lluvia de Meteoros | Área | Canaliza 2 s: cae un meteoro cada 0,4 s en el área. | 300/450/600 | 120% AP | 110/95/80 | 100 | 1300 |

### Nyxe, Tejesueños
*Feérico · Bosque Onírico · Mago · Mid / Soporte*

> Hada que roba pesadillas a los niños... y a veces se las devuelve a los adultos.

**Estadísticas N1:** Vida 560 (+92) · AD 52 (+3.0) · Armadura 22 (+4.2) · RM 30 (+1.3) · Vel. ataque 0.625 (+1.8%) · Vel. mov. 335 · Alcance 525

**Pasiva — Polvo de Hada:** Cada 4ª habilidad lanzada es gratuita y gana 50 de alcance.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Mariposas Oníricas | Proyectil | Lanza 3 mariposas que persiguen al enemigo más cercano. | 30/45/60/75/90 | 30% AP | 7/6.5/6/5.5/5 | 60 | 700 |
| W | Somnolencia | Área | Tras 1,5 s duerme 1,5 s a los enemigos del área (el daño despierta). | 0/0/0/0/0 | — | 16/15/14/13/12 | 80 | 800 |
| E | Paso Fae | Desplazamiento | Parpadea 400 u. y se vuelve invisible 1 s. | 0/0/0/0/0 | — | 18/16/14/12/10 | 60 | 400 |
| R | Pesadilla Compartida | Objetivo | Encierra a un campeón 2 s en un sueño: no ve a nadie; al salir sufre daño. | 200/300/400 | 80% AP | 120/100/80 | 100 | 700 |

### Zerath, El Hambre Profunda
*Espíritu del Vacío · La Grieta · Mago · Mid / Top*

> Fragmento consciente del vacío que aprendió a imitar la forma humana devorando recuerdos.

**Estadísticas N1:** Vida 620 (+92) · AD 52 (+3.0) · Armadura 22 (+4.2) · RM 32 (+1.3) · Vel. ataque 0.625 (+1.8%) · Vel. mov. 330 · Alcance 525

**Pasiva — Devorar:** Las habilidades cuestan 5% de vida actual; cada asesinato o asistencia da +5 PH permanente.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Mano del Vacío | Área | Tras 0,5 s, garras emergen del suelo y ralentizan un 60%. | 70/110/150/190/230 | 60% AP | 8/7.5/7/6.5/6 | — | 800 |
| W | Absorber | Drenaje | Canaliza 3 s sobre un objetivo: daño por segundo y se cura el 60%. | 40/60/80/100/120 | 25% AP | 14/13/12/11/10 | — | 500 |
| E | Fase | Autobuff | Se vuelve inalcanzable 1 s. | 0/0/0/0/0 | — | 22/20/18/16/14 | — | 0 |
| R | Singularidad | Área | Crea un agujero negro de 2,5 s que atrae continuamente al centro. | 250/375/500 | 90% AP | 130/115/100 | — | 750 |

### Lyra Vientoalto, Flecha del Cielo
*Elfo Silvano · Bosque Onírico · Tirador · Carril inferior (tirador)*

> Exploradora élfica capaz de acertar a un halcón en vuelo a un kilómetro de distancia.

**Estadísticas N1:** Vida 580 (+96) · AD 60 (+2.6) · Armadura 26 (+4.2) · RM 30 (+1.3) · Vel. ataque 0.658 (+3.2%) · Vel. mov. 330 · Alcance 600

**Pasiva — Ojo de Halcón:** Atacar al mismo objetivo 3 veces seguidas da 30% de vel. ataque durante 3 s.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Flecha Perforante | Línea | Disparo cargado que atraviesa a todos los enemigos (-10% daño por objetivo). | 40/75/110/145/180 | 110% AD | 9/8/7/6/5 | 50 | 1100 |
| W | Lluvia de Flechas | Área | Ralentiza un 30% y daña en un área circular. | 60/95/130/165/200 | 60% AD_BONUS | 14/13/12/11/10 | 70 | 900 |
| E | Voltereta | Desplazamiento | Rueda 300 u.; el siguiente ataque tiene +100 de alcance. | 0/0/0/0/0 | — | 12/11/10/9/8 | 40 | 300 |
| R | Saeta Celeste | Proyectil global | Flecha que cruza el mapa; aturde según la distancia (1-3,5 s). | 200/325/450 | 100% AP | 100/90/80 | 100 | Global |

### Gearix, Ingeniera Loca
*Gnomo · Consorcio de Engranajes · Tirador · Carril inferior (tirador)*

> Genio expulsada de cuatro academias por 'exceso de explosiones'. Le parece una crítica injusta.

**Estadísticas N1:** Vida 580 (+96) · AD 62 (+2.6) · Armadura 26 (+4.2) · RM 30 (+1.3) · Vel. ataque 0.658 (+3.2%) · Vel. mov. 330 · Alcance 575

**Pasiva — Cargador:** Cada 6º ataque es un disparo de escopeta en cono con 150% de daño.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Torreta Portátil | Invocación | Despliega una torreta (máx. 2) que ataca 8 s. | 20/30/40/50/60 | 30% AD | 12/11/10/9/8 | — | 500 |
| W | Granada de Humo | Área | Ciega a los enemigos del área 1,5 s (sus ataques fallan). | 50/80/110/140/170 | 50% AP | 16/15/14/13/12 | — | 700 |
| E | Retroceso | Desplazamiento | Dispara hacia delante y sale despedida 400 u. hacia atrás. | 40/70/100/130/160 | 50% AD_BONUS | 16/14/12/10/8 | — | 400 |
| R | Gran Cañón | Línea | Tras 1 s de carga, rayo que daña un 50% más a objetivos con poca vida. | 250/400/550 | 150% AD_BONUS | 90/75/60 | — | 1500 |

### Sable, La Sombra sin Nombre
*Humano · Hermandad del Velo · Asesino · Mid / Jungla*

> Nadie conoce su verdadero nombre, ni siquiera la Hermandad que la entrenó.

**Estadísticas N1:** Vida 590 (+98) · AD 64 (+3.3) · Armadura 30 (+4.5) · RM 32 (+2.0) · Vel. ataque 0.668 (+2.2%) · Vel. mov. 350 · Alcance 125

**Pasiva — Marca Mortal:** Golpear a un campeón aislado (sin aliados en 600 u.) inflige un 25% de daño extra.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Daga Sombría | Proyectil | Lanza una daga; si impacta, puede teletransportarse detrás del objetivo. | 60/95/130/165/200 | 80% AD_BONUS | 8/7.5/7/6.5/6 | 50 | 700 |
| W | Velo | Sigilo | Invisible 2 s y +20% vel. movimiento. | 0/0/0/0/0 | — | 20/18/16/14/12 | 60 | 0 |
| E | Abanico de Cuchillas | Área | Cuchillas a su alrededor; ralentizan un 30%. | 50/75/100/125/150 | 60% AD_BONUS | 6/5.5/5/4.5/4 | 40 | 300 |
| R | Ejecución | Objetivo | Marca a un campeón; tras 3 s la marca explota con el 30% del daño infligido. | 100/175/250 | 100% AD_BONUS | 90/75/60 | — | 625 |

### Rakhar, Garra Escarlata
*Bestial (felino) · Tribus de las Dunas · Asesino · Jungla*

> Cazador del desierto que prefiere presas que puedan defenderse.

**Estadísticas N1:** Vida 590 (+98) · AD 66 (+3.3) · Armadura 30 (+4.5) · RM 32 (+2.0) · Vel. ataque 0.668 (+2.2%) · Vel. mov. 350 · Alcance 125

**Pasiva — Instinto de Caza:** Ve a los campeones enemigos por debajo del 50% de vida a 1500 u. y gana 15% vel. movimiento hacia ellos.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Zarpazo | Objetivo | 3 zarpazos rápidos; el 3º inflige el doble. | 30/45/60/75/90 | 50% AD_BONUS | 7/6.5/6/5.5/5 | — | 175 |
| W | Rugido | Área | Asusta 0,75 s a los enemigos cercanos. | 40/65/90/115/140 | 40% AD_BONUS | 18/17/16/15/14 | — | 325 |
| E | Abalanzarse | Desplazamiento | Salta sobre un objetivo; se reinicia con asesinatos o asistencias. | 60/90/120/150/180 | 70% AD_BONUS | 12/11/10/9/8 | — | 650 |
| R | Cacería | Autobuff | 6 s: +40% vel. movimiento, se vuelve invisible fuera de combate y su próximo ataque es crítico. | 0/0/0 | — | 100/85/70 | — | 0 |

### Elowen, Voz del Bosque
*Dríade · Bosque Onírico · Soporte · Soporte*

> Espíritu del roble más antiguo, despertado para curar la tierra herida por la guerra.

**Estadísticas N1:** Vida 570 (+94) · AD 50 (+2.8) · Armadura 28 (+4.2) · RM 30 (+1.3) · Vel. ataque 0.625 (+2.0%) · Vel. mov. 335 · Alcance 550

**Pasiva — Florecer:** Las curaciones dejan una flor que da 15 de vida extra al aliado que la pisa.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Raíces Atadoras | Proyectil | Inmoviliza 1,25 s al primer enemigo. | 70/110/150/190/230 | 50% AP | 13/12/11/10/9 | 60 | 1000 |
| W | Savia Vital | Curación | Cura a un aliado y a sí misma 70-230 (+35% PH). | 70/110/150/190/230 | 35% AP | 10/9.5/9/8.5/8 | 80 | 700 |
| E | Corteza | Escudo aliado | El aliado gana 20 de armadura y RM y su próximo ataque inmoviliza. | 0/0/0/0/0 | — | 14/13/12/11/10 | 60 | 700 |
| R | Renacer del Bosque | Área aliada | Gran área de curación durante 3 s; los aliados que mueran en ella reviven con un 20% de vida (1 vez). | 150/250/350 | 60% AP | 160/140/120 | 100 | 900 |

### Aurik, Heraldo Dorado
*Dracónido · Orden del Sol Partido · Soporte · Soporte*

> Dragón joven que adoptó forma humanoide para servir a la orden que salvó su huevo.

**Estadísticas N1:** Vida 600 (+94) · AD 50 (+2.8) · Armadura 31 (+4.2) · RM 30 (+1.3) · Vel. ataque 0.625 (+2.0%) · Vel. mov. 335 · Alcance 550

**Pasiva — Escamas de Oro:** Los aliados cercanos ganan 5 de armadura; el doble si Aurik está en forma de dragón.

| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |
|---|---|---|---|---|---|---|---|---|
| Q | Aliento Solar | Cono | Cono de fuego dorado que ralentiza un 30%. | 60/95/130/165/200 | 50% AP | 9/8.5/8/7.5/7 | 60 | 550 |
| W | Ala Protectora | Desplazamiento aliado | Vuela hacia un aliado y ambos ganan un escudo de 60-200. | 60/95/130/165/200 | 30% AP | 16/15/14/13/12 | 70 | 800 |
| E | Rugido Dracónico | Área | Aturde 0,75 s a los enemigos cercanos. | 50/80/110/140/170 | 40% AP | 16/15/14/13/12 | 70 | 300 |
| R | Forma Dragón | Transformación | 8 s: vuela (ignora terreno), +300 de vida y su Q pasa a ser una línea de 900 u. | 100/150/200 | 30% AP | 140/120/100 | 100 | 0 |

## Formulas
- Estadística a nivel n = base + crecimiento × (n−1) × (0,7025 + 0,0175 × (n−1)).
- Daño de habilidad = base[rango] + Σ(ratio × estadística).
- Mitigación = 100 / (100 + resistencia) (física con armadura, mágica con RM).

## Edge Cases
- Zerath no puede lanzar habilidades si el coste (5% de vida actual) le dejaría por debajo de 1 punto de vida.
- La R de Tharok (vida mínima 1) no impide la muerte por daño verdadero de torre de Nexo.
- La R de Ossuar (Cripta) no bloquea las habilidades globales (R de Lyra).

## Dependencies
- `design/gdd/combat-core.md` (fórmulas de daño, control de masas)
- `design/gdd/progression-economy.md` (niveles, oro, objetos)

## Tuning Knobs
- `CLASS_STATS` (plantilla por clase) y `stats` (desviaciones por campeón) en `tools/champions_src.py`.
- Banda de equilibrio del combo: 40%–190% de la media (validada por `--check`).

## Acceptance Criteria
- `python3 tools/build_design.py --check` termina sin errores.
- Las 6 clases están cubiertas, cada campeón tiene Q/W/E/R y una pasiva, y los CD nunca suben con el rango.
