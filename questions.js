/* ═══════════════════════════════════════════════════
   questions.js — Punto de entrada de preguntas

   CONTENIDO:
     · QUESTIONS        — Combinación de todas las dificultades
                          (se construye desde los archivos por dificultad)
     · SPECIAL_CAT_META — Metadatos de las categorías especiales
     · SPECIAL_QUESTIONS — Preguntas de los modos especiales

   Para añadir preguntas generales, edita el archivo
   correspondiente a la dificultad:
     · questions_easy.js   → diff:"easy"  (133 preguntas)
     · questions_medium.js → diff:"med"   (83 preguntas)
     · questions_hard.js   → diff:"hard"  (47 preguntas)

   ORDEN EN index.html (deben cargarse ANTES de gameplay.js):
       <script src="questions_easy.js"></script>
       <script src="questions_medium.js"></script>
       <script src="questions_hard.js"></script>
       <script src="questions.js"></script>
       <script src="gameplay.js"></script>
═══════════════════════════════════════════════════ */

const QUESTIONS = [
  ...QUESTIONS_EASY,
  ...QUESTIONS_MEDIUM,
  ...QUESTIONS_HARD,
];



/* ═══════════════════════════════════════════════════
   SPECIAL CATEGORY GAME MODE
═══════════════════════════════════════════════════ */
const SPECIAL_CAT_META = {
  realfake:  { icon:'🎲', name:'¿Real o inventado?',    color:'var(--amber)',   desc:'Adivina si estas cosas rarísimas existen de verdad o son inventadas' },
  peli:      { icon:'🎬', name:'¿De qué peli es?',       color:'#e879f9',        desc:'Reconoce la película por sus frases míticas y momentos icónicos' },
  cancion:   { icon:'🎧', name:'Adivina la canción',     color:'var(--teal)',    desc:'Identifica la canción por pistas de su letra o descripción' },
  trampa:    { icon:'🧠', name:'Trampas mentales',       color:'var(--purple)',  desc:'Preguntas con trampa — el sentido común te puede engañar' },
  absurda:   { icon:'😂', name:'Preguntas absurdas',     color:'var(--green)',   desc:'Sin sentido pero divertidas — el humor ante todo' },
  genios:    { icon:'🔥', name:'Solo genios',            color:'var(--red)',     desc:'Preguntas MUY difíciles para quienes buscan un reto real' },
  velocidad: { icon:'⚡', name:'Velocidad extrema',      color:'var(--amber)',   desc:'Tiempo muy reducido — tus reflejos y conocimiento a prueba' },
  detective: { icon:'🕵️', name:'Detective',              color:'#60a5fa',        desc:'Te dan pistas progresivas y tienes que deducir la respuesta' },
  sabias:    { icon:'🌍', name:'Cosas que no sabías',    color:'var(--teal)',    desc:'Datos curiosos y WTF — aprenderás algo raro con cada pregunta' },
  probable:  { icon:'🤯', name:'Elige la más probable',  color:'#e879f9',        desc:'Sin respuesta obvia — tienes que razonar cuál es la más probable' },
};

// Special questions per mode (10 per mode, AI-generated feel)
const SPECIAL_QUESTIONS = {
  realfake: [
    { q:'¿Es real o inventado? El "Pez Blob" (Psychrolutes marcidus), un pez que parece una cara triste de gelatina rosa.', opts:['Real','Inventado'], a:0, exp:'¡Real! Es el animal con la cara más triste del mundo y vive en las profundidades.' },
    { q:'¿Es real o inventado? El "Globo de mantequilla" — un animal marino que produce mantequilla real para repeler depredadores.', opts:['Real','Inventado'], a:1, exp:'Inventado. No existe tal animal, aunque suena delicioso.' },
    { q:'¿Es real o inventado? En Japón existe un "Café de Búhos" donde puedes tomar café rodeado de búhos reales.', opts:['Real','Inventado'], a:0, exp:'¡Real! Los fukuro cafés son populares en Tokio y otras ciudades japonesas.' },
    { q:'¿Es real o inventado? La "lluvia de peces" — a veces llueven peces reales del cielo en algunas regiones del mundo.', opts:['Real','Inventado'], a:0, exp:'¡Real! Ocurre en Yoro (Honduras) y otras zonas. Los tornados marinos los arrastran.' },
    { q:'¿Es real o inventado? Existe un país llamado "Liberland" con su propia moneda y constitución fundado en 2015.', opts:['Real','Inventado'], a:0, exp:'¡Real! Es un microestado no reconocido entre Croacia y Serbia fundado por un checo.' },
    { q:'¿Es real o inventado? El "Tamaño de la mente de los peces" — los peces goldfish tienen memoria de 3 segundos.', opts:['Real','Inventado'], a:1, exp:'Inventado. Es un mito. Los peces goldfish tienen memoria de meses, no segundos.' },
    { q:'¿Es real o inventado? En Australia existe un árbol llamado "Gimpi-Gimpi" cuyo simple roce puede causar dolor durante meses.', opts:['Real','Inventado'], a:0, exp:'¡Real y aterrador! Sus pelos microscópicos inyectan una neurotoxina muy dolorosa.' },
    { q:'¿Es real o inventado? El "Museo del Pan de Molde" en Berlín — dedicado exclusivamente al pan de molde industrial.', opts:['Real','Inventado'], a:1, exp:'Inventado. No existe tal museo, aunque Alemania tiene museos raros de verdad.' },
    { q:'¿Es real o inventado? Las hormigas pueden sobrevivir en el microondas porque las microondas tienen puntos ciegos.', opts:['Real','Inventado'], a:0, exp:'¡Real! Las microondas tienen zonas sin radiación y las hormigas son demasiado pequeñas.' },
    { q:'¿Es real o inventado? Existe un hotel en Suecia construido completamente con hielo y nieve que se reconstruye cada año.', opts:['Real','Inventado'], a:0, exp:'¡Real! El Icehotel en Jukkasjärvi lleva haciéndolo desde 1990.' },
  ],
  peli: [
    { q:'¿De qué película es la frase? "Que la Fuerza te acompañe."', opts:['Star Wars','Star Trek','Interstellar','Avatar'], a:0, exp:'Star Wars (1977) de George Lucas. La frase más icónica de la ciencia ficción.' },
    { q:'¿De qué película es la frase? "Houston, tenemos un problema."', opts:['Gravedad','Apolo 13','Interstellar','El Marciano'], a:1, exp:'Apolo 13 (1995). En realidad la frase real fue "Houston, hemos tenido un problema".' },
    { q:'¿De qué película es la frase? "Yo soy tu padre."', opts:['Star Wars V','Star Wars IV','Star Wars VI','Rogue One'], a:0, exp:'Star Wars: El Imperio Contraataca (1980). Darth Vader a Luke Skywalker.' },
    { q:'¿De qué película es esta descripción? Un muñeco de madera que quiere convertirse en niño real y tiene una conciencia llamada Grillo Parlante.', opts:['Pinocho','Bambi','Dumbo','Peter Pan'], a:0, exp:'Pinocho (1940), el clásico de Disney basado en el cuento de Carlo Collodi.' },
    { q:'¿De qué película es la frase? "Con gran poder viene una gran responsabilidad."', opts:['Batman','Superman','Spider-Man','Iron Man'], a:2, exp:'Spider-Man (2002). El Tío Ben le dice esto a Peter Parker.' },
    { q:'¿De qué película es esta descripción? Un ogro verde que vive en un pantano y viaja con un asno parlanchín para rescatar a una princesa.', opts:['Shrek','Brave','La Bella y la Bestia','El Rey León'], a:0, exp:'Shrek (2001) de DreamWorks. El ogro más querido del cine animado.' },
    { q:'¿De qué película es la frase? "La vida es como una caja de bombones, nunca sabes lo que te va a tocar."', opts:['El Show de Truman','Forrest Gump','Cast Away','Big'], a:1, exp:'Forrest Gump (1994). Tom Hanks pronuncia esta frase memorable.' },
    { q:'¿De qué película es esta descripción? Un niño ve muertos sin saberlo y un psicólogo intenta ayudarle con esta inquietante habilidad.', opts:['El Exorcista','El Sexto Sentido','Poltergeist','Expediente Warren'], a:1, exp:'El Sexto Sentido (1999) de M. Night Shyamalan. Con el giro final más comentado.' },
    { q:'¿De qué película es la frase? "Hasta el infinito y más allá."', opts:['Cars','Toy Story','Buscando a Nemo','Monsters Inc'], a:1, exp:'Toy Story (1995). El grito de batalla del astronauta Buzz Lightyear.' },
    { q:'¿De qué película es esta descripción? Un hombre despierta en un búnker y descubre que lleva años solo manteniendo una simulación del fin del mundo.', opts:['El Bunker','10 Cloverfield Lane','Silo','El Hoyo'], a:1, exp:'10 Cloverfield Lane (2016). Un thriller de suspense claustrofóbico.' },
  ],
  cancion: [
    { q:'¿Qué canción tiene estos versos? "Never gonna give you up, never gonna let you down..."', opts:['Rick Astley - Never Gonna Give You Up','A-ha - Take On Me','Toto - Africa','Queen - Don\'t Stop Me Now'], a:0, exp:'Rick Astley (1987). El origen del "Rickroll", una de las bromas más famosas de internet.' },
    { q:'Estos son los primeros acordes descritos: Do-Re-Mi-Sol-La repetitivos con letra sobre dejar ir. ¿Qué canción es?', opts:['Frozen - Let It Go','Titanic - My Heart Will Go On','The Lion King - Circle of Life','Beauty and the Beast'], a:0, exp:'Let It Go de Frozen (2013). Interpretada por Idina Menzel, ganó el Oscar a Mejor Canción.' },
    { q:'¿Qué canción comienza con "Is this the real life? Is this just fantasy?"', opts:['We Are the Champions','Bohemian Rhapsody','Don\'t Stop Me Now','Somebody to Love'], a:1, exp:'Bohemian Rhapsody de Queen (1975). Considerada una de las mejores canciones de la historia.' },
    { q:'Pista: "Thriller" nocturno, muertos vivientes, Michael Jackson. ¿Cuál es la canción?', opts:['Beat It','Billie Jean','Thriller','Smooth Criminal'], a:2, exp:'Thriller (1982). El videoclip más visto de la historia del pop.' },
    { q:'¿Qué canción tiene esta descripción? Una mujer llama a su ex 7 veces una noche y le pregunta si sigue pensando en ella, de Adele.', opts:['Someone Like You','Hello','Rolling in the Deep','Set Fire to the Rain'], a:1, exp:'Hello de Adele (2015). Rompió varios récords en plataformas de streaming.' },
    { q:'¿Qué canción tiene el estribillo "I will always love you"? — versión de película famosa.', opts:['Whitney Houston','Dolly Parton','Mariah Carey','Céline Dion'], a:0, exp:'Whitney Houston la hizo famosa en El Guardaespaldas (1992), original de Dolly Parton.' },
    { q:'Pista: rap español, "Quevedo", verano de 2022, número 1 mundial en Spotify. ¿Cuál es la canción?', opts:['Bzrp Session 52','Cayó la noche','Columbia','Con Altura'], a:0, exp:'Bzrp Music Sessions #52 con Quevedo fue la primera canción en español en liderar Spotify global.' },
    { q:'¿Qué canción describe? Niña con paraguas roja en la lluvia que quiere que su amado esté bajo ese paraguas con ella.', opts:['Shakira - Hips Don\'t Lie','Rihanna - Umbrella','Beyoncé - Irreplaceable','Katy Perry - Firework'], a:1, exp:'Umbrella de Rihanna (2007). Uno de sus mayores éxitos con el icónico "ella ella eh eh".' },
    { q:'¿Qué canción tiene estos versos? "Tú me hiciste creer que éramos para siempre, pero solo era un juego para ti"... de Bad Bunny.', opts:['Tití Me Preguntó','Me Porto Bonito','Un Verano Sin Ti','Neverita'], a:3, exp:'Neverita de Bad Bunny (2022), del álbum "Un Verano Sin Ti".' },
    { q:'Pista: reggaeton clásico, "daddy, daddy", Daddy Yankee, 2004, movimiento de caderas. ¿Cuál es?', opts:['Gasolina','Rompe','Lo Que Pasó Pasó','Con Calma'], a:0, exp:'Gasolina (2004) de Daddy Yankee. La canción que popularizó el reggaeton mundialmente.' },
  ],
  trampa: [
    { q:'¿Cuántos meses del año tienen 28 días?', opts:['1','6','12','2'], a:2, exp:'¡Todos! Los 12 meses tienen al menos 28 días. Solo febrero tiene exactamente 28 (o 29).' },
    { q:'Un gallo pone un huevo en lo alto de un tejado. ¿Hacia qué lado cae el huevo?', opts:['Al sur','Al norte','Al este','Los gallos no ponen huevos'], a:3, exp:'¡Los gallos no ponen huevos! Solo las gallinas lo hacen.' },
    { q:'Si conduces un autobús con 43 pasajeros y paras para recoger 7 más, luego bajan 9... ¿Qué edad tiene el conductor?', opts:['No se puede saber','41','43','37'], a:0, exp:'La pregunta dice "si CONDUCES un autobús". Tú eres el conductor. La edad es la tuya.' },
    { q:'¿Qué es más pesado: un kilo de plumas o un kilo de hierro?', opts:['Las plumas','El hierro','Pesan igual','Depende de la altitud'], a:2, exp:'¡Pesan igual! Los dos pesan un kilo. El truco está en asociar "pluma" con ligereza.' },
    { q:'Un padre tiene 5 hijos. La mitad son niñas. ¿Cuántos niños hay?', opts:['2','3','2,5','Es imposible'], a:2, exp:'5/2 = 2,5 que no es entero. La respuesta es 2,5 en sentido matemático, pero en la práctica es una trampa.' },
    { q:'¿Cuántos animales de cada especie llevó Moisés en el arca?', opts:['2','Ninguno','7','Los necesarios'], a:1, exp:'¡Ninguno! Fue Noé quien construyó el arca, no Moisés.' },
    { q:'Si tienes una habitación con 3 interruptores y 3 bombillas... y solo puedes entrar una vez, ¿puedes saber cuál es cuál?', opts:['No, es imposible','Sí, usando el calor','Sí, pero necesitas 2 entradas','No si están apagadas'], a:1, exp:'¡Sí! Enciende el 1º un rato, apágalo, enciende el 2º y entra. Caliente=1º, encendida=2º, fría y apagada=3º.' },
    { q:'¿Puede un hombre en España casarse con la hermana de su viuda?', opts:['No, está prohibido','Sí, con permiso judicial','No se puede decir','No, porque está muerto'], a:3, exp:'Si tiene una "viuda", ¡el hombre está muerto! No puede casarse con nadie.' },
    { q:'Un avión se estrella exactamente en la frontera entre Francia y España. ¿Dónde entierran a los supervivientes?', opts:['En Francia','En España','En el país del avión','A los supervivientes no se les entierra'], a:3, exp:'¡Los supervivientes están vivos! No se entierran.' },
    { q:'Si hay 6 manzanas y te llevas 4, ¿cuántas manzanas tienes?', opts:['2','4','6','Depende'], a:1, exp:'¡4! Tú te llevas 4 manzanas, así que tú tienes 4. Las 2 restantes no son tuyas.' },
  ],
  absurda: [
    { q:'Si un cocodrilo pesara 300 kilos pero fuera muy buena persona, ¿te fiarías de él?', opts:['Sí, la bondad es lo que importa','No, pesa 300 kilos','Depende de si tiene hambre','Solo si tiene referencias'], a:2, exp:'La respuesta más honesta. Su comportamiento depende de sus últimas comidas.' },
    { q:'¿Cuántas pizzas hacen falta para construir una casa de tamaño medio?', opts:['Unas 1.000','Unas 50.000','No se puede','Con suficiente queso, las que haga falta'], a:3, exp:'Con suficiente determinación y queso fundido, los límites son solo mentales.' },
    { q:'Si los zombies atacaran mañana por la mañana, ¿cuál sería tu primera acción?', opts:['Ir al supermercado','Llamar a mi familia','Subir un story','Seguir durmiendo'], a:2, exp:'Estadísticamente, muchos usuarios subirían un story antes de evacuar. Somos así.' },
    { q:'Un pato y un filósofo entran en un bar. El filósofo pregunta: "¿Existes?" El pato responde: "Cuac". ¿Quién tiene razón?', opts:['El filósofo','El pato','Los dos','El barman'], a:1, exp:'El pato al menos demuestra existencia con hechos. Descartes estaría de acuerdo: cogito ergo cuac.' },
    { q:'¿Cuál es el sonido que hace un ordenador cuando se acaba la batería en el peor momento posible?', opts:['Bip suave','Un grito interior','Silencio eterno','La canción de tu ex'], a:2, exp:'El silencio más aterrador del universo tecnológico conocido.' },
    { q:'Si pudieras hablar con los animales pero solo con los más aburridos, ¿con cuál hablarías?', opts:['Una tortuga','Un pez de colores','Un caracol','Una esponja de mar'], a:0, exp:'Las tortugas al menos tienen experiencia y sabiduría acumulada. Una conversación lenta pero profunda.' },
    { q:'¿Qué pasaría si todas las palomas del mundo decidieran hacer huelga el mismo día?', opts:['Nada importante','El caos en las plazas','Las estatuas agradecerían el descanso','Los turistas llorarían'], a:2, exp:'Las estatuas de todo el mundo necesitan ese respiro. Es lo más justo.' },
    { q:'Un científico descubre que los gatos controlan el universo. ¿Cuál es tu reacción?', opts:['Pánico total','Alivio — al menos alguien lo controla','Pedir confirmación a mi gato','Ya lo sabía'], a:3, exp:'Mucha gente ya sospechaba esto. Los gatos tienen demasiada actitud para ser simples mascotas.' },
    { q:'¿Cuántos lunes aguantaría un lunes si los lunes pudieran aguantarse?', opts:['Ninguno','Solo uno','Todos los que hiciera falta','Los lunes no pueden aguantarse'], a:3, exp:'Los lunes no pueden aguantarse. Está científicamente demostrado por cualquier persona con trabajo.' },
    { q:'Si el fuego fuera frío, ¿qué pasaría con los cuentes de hadas?', opts:['Las brujas serían más simpáticas','Los dragones darían abrazos fríos','Las fogatas serían una opción veraniega','Todo dejaría de tener sentido'], a:1, exp:'Los dragones, aliviados por fin, usarían su hálito para refrescar a los caballeros en verano.' },
  ],
  genios: [
    { q:'¿En qué año exacto se publicó por primera vez "On the Origin of Species" de Darwin?', opts:['1859','1856','1862','1871'], a:0, exp:'Charles Darwin publicó "El origen de las especies" el 24 de noviembre de 1859.' },
    { q:'¿Cuál es el elemento químico con número atómico 78?', opts:['Paladio','Platino','Iridio','Osmio'], a:1, exp:'El platino (Pt) tiene número atómico 78 y es uno de los metales más valiosos.' },
    { q:'¿Cuántas lunas tiene Saturno reconocidas oficialmente según datos de 2024?', opts:['62','83','146','117'], a:2, exp:'Saturno tiene 146 lunas confirmadas — el planeta con más lunas del sistema solar.' },
    { q:'¿Cuál fue la primera ciudad del mundo en superar el millón de habitantes?', opts:['Roma','Babilonia','Chang\'an','Atenas'], a:0, exp:'Roma fue la primera ciudad en superar el millón de habitantes, hacia el siglo I d.C.' },
    { q:'¿Qué país tiene más fronteras terrestres con otros países?', opts:['Rusia','China','Brasil','Alemania'], a:1, exp:'China comparte frontera terrestre con 14 países, aunque Rusia también con 14. Suelen citarse ambos.' },
    { q:'¿Qué teorema establece que en todo grafo conexo sin vértices de grado impar existe un circuito euleriano?', opts:['Teorema de Euler','Teorema de Hamilton','Teorema de Kuratowski','Teorema de Ramsey'], a:0, exp:'El Teorema de Euler (1736) fue la base de la teoría de grafos y nació del problema de los puentes de Königsberg.' },
    { q:'¿En qué capa de la atmósfera ocurren la mayoría de los fenómenos meteorológicos?', opts:['Estratosfera','Mesosfera','Tropósfera','Termosfera'], a:2, exp:'La tropósfera (0-12 km) contiene el 75% de la masa atmosférica y toda el agua. Aquí ocurre el clima.' },
    { q:'¿Qué filósofo escribió "La Fenomenología del Espíritu" en 1807?', opts:['Kant','Schopenhauer','Hegel','Fichte'], a:2, exp:'Georg Wilhelm Friedrich Hegel publicó la Fenomenología del Espíritu en 1807, obra clave del idealismo alemán.' },
    { q:'¿Cuál es la constante de Planck aproximada en J·s?', opts:['6,63 × 10⁻³⁴','9,11 × 10⁻³¹','1,38 × 10⁻²³','3,00 × 10⁸'], a:0, exp:'h ≈ 6,626 × 10⁻³⁴ J·s. Fundamental para la mecánica cuántica, propuesta por Max Planck en 1900.' },
    { q:'¿En qué siglo d.C. cayó el Imperio Romano de Occidente?', opts:['IV','V','VI','III'], a:1, exp:'El Imperio Romano de Occidente cayó en el año 476 d.C., cuando Odoacro depuso a Rómulo Augústulo.' },
  ],
  velocidad: [
    { q:'⚡ RÁPIDO: ¿Capital de Australia?', opts:['Sídney','Melbourne','Canberra','Brisbane'], a:2, exp:'Canberra, no Sídney. Es el error más común en geografía australiana.' },
    { q:'⚡ RÁPIDO: ¿Cuántos lados tiene un hexágono?', opts:['5','6','7','8'], a:1, exp:'Un hexágono tiene 6 lados. Hexa = 6 en griego.' },
    { q:'⚡ RÁPIDO: ¿Qué animal es el más rápido del mundo?', opts:['León','Guepardo','Águila','Halcón peregrino'], a:3, exp:'El halcón peregrino alcanza 389 km/h en picado. El guepardo es el más rápido en tierra.' },
    { q:'⚡ RÁPIDO: ¿En qué año llegó el hombre a la Luna?', opts:['1967','1968','1969','1970'], a:2, exp:'El Apollo 11 llegó el 20 de julio de 1969. Neil Armstrong y Buzz Aldrin.' },
    { q:'⚡ RÁPIDO: ¿Cuántos huesos tiene el cuerpo humano adulto?', opts:['196','206','216','226'], a:1, exp:'206 huesos en adultos. Los bebés nacen con ~270, que se fusionan con la edad.' },
    { q:'⚡ RÁPIDO: ¿Qué color mezcla rojo y azul?', opts:['Verde','Naranja','Morado','Marrón'], a:2, exp:'Rojo + Azul = Morado/Violeta. Básico de la teoría del color.' },
    { q:'⚡ RÁPIDO: ¿Quién pintó la Mona Lisa?', opts:['Miguel Ángel','Rafael','Leonardo da Vinci','Botticelli'], a:2, exp:'Leonardo da Vinci pintó la Mona Lisa entre 1503 y 1519.' },
    { q:'⚡ RÁPIDO: ¿Cuánto es 17 × 8?', opts:['126','134','136','144'], a:2, exp:'17 × 8 = 136.' },
    { q:'⚡ RÁPIDO: ¿Cuál es el océano más grande del mundo?', opts:['Atlántico','Índico','Ártico','Pacífico'], a:3, exp:'El Pacífico cubre más superficie que todos los continentes juntos.' },
    { q:'⚡ RÁPIDO: ¿En qué país está la Torre Eiffel?', opts:['Italia','Bélgica','Francia','Suiza'], a:2, exp:'En París, Francia. Construida entre 1887 y 1889 por Gustave Eiffel.' },
  ],
  detective: [
    { q:'🕵️ PISTA 1: Es un lugar. PISTA 2: Está en Asia. PISTA 3: Es la ciudad más poblada del mundo. ¿Qué es?', opts:['Pekín','Tokio','Shanghái','Mumbai'], a:1, exp:'Tokio es la ciudad más poblada del mundo con más de 37 millones de personas en su área metropolitana.' },
    { q:'🕵️ PISTA 1: Es un animal. PISTA 2: Tiene rayas. PISTA 3: Es el félido más grande del mundo. ¿Qué es?', opts:['León','Leopardo','Tigre','Guepardo'], a:2, exp:'El tigre (Panthera tigris) es el félido más grande del mundo y el único con rayas.' },
    { q:'🕵️ PISTA 1: Es un objeto inventado en el s. XIX. PISTA 2: Usa electricidad. PISTA 3: Thomas Edison lo perfeccionó. ¿Qué es?', opts:['Teléfono','Bombilla eléctrica','Radio','Televisión'], a:1, exp:'La bombilla eléctrica incandescente fue perfeccionada por Edison en 1879.' },
    { q:'🕵️ PISTA 1: Es una lengua. PISTA 2: Es artificial, creada por un humano. PISTA 3: Fue creada para promover la paz mundial en 1887. ¿Qué es?', opts:['Latín','Esperanto','Klingon','Interlingua'], a:1, exp:'El Esperanto fue creado por Ludwig Lazarus Zamenhof en 1887 como lengua auxiliar universal.' },
    { q:'🕵️ PISTA 1: Es un país. PISTA 2: No tiene costa marítima. PISTA 3: Está completamente rodeado por otro país. ¿Qué es?', opts:['Suiza','Liechtenstein','Luxemburgo','Lesoto'], a:3, exp:'Lesoto está completamente rodeado por Sudáfrica. Es uno de los únicos países enclave del mundo.' },
    { q:'🕵️ PISTA 1: Es un científico. PISTA 2: Nació en Polonia. PISTA 3: Primera persona en ganar dos Premios Nobel (física y química). ¿Quién es?', opts:['Lise Meitner','Rosalind Franklin','Marie Curie','Irène Joliot-Curie'], a:2, exp:'Marie Curie ganó el Nobel de Física (1903) y el de Química (1911). Única persona con dos Nobel científicos.' },
    { q:'🕵️ PISTA 1: Es una estructura. PISTA 2: Es visible desde el espacio (según el mito). PISTA 3: Tiene más de 21.000 km de largo. ¿Qué es?', opts:['Canal de Suez','Gran Muralla China','Muro de Berlín','Via Apia'], a:1, exp:'La Gran Muralla China. (Nota: el mito de verla desde el espacio es falso, pero la pregunta lo menciona como mito).' },
    { q:'🕵️ PISTA 1: Es un libro. PISTA 2: El protagonista lucha contra molinos de viento. PISTA 3: Se publicó en España en 1605. ¿Cuál es?', opts:['El Lazarillo de Tormes','Tirant lo Blanc','Don Quijote de la Mancha','La Celestina'], a:2, exp:'Don Quijote de la Mancha de Miguel de Cervantes (1605). La novela más importante en lengua española.' },
    { q:'🕵️ PISTA 1: Es un fenómeno natural. PISTA 2: Ocurre solo de noche. PISTA 3: Se produce cuando la Luna entra en la sombra de la Tierra. ¿Qué es?', opts:['Eclipse solar','Aurora boreal','Eclipse lunar','Superluna'], a:2, exp:'El eclipse lunar ocurre cuando la Tierra se interpone entre el Sol y la Luna, proyectando su sombra.' },
    { q:'🕵️ PISTA 1: Es un número. PISTA 2: Es irracional. PISTA 3: Aparece en el perímetro de cualquier círculo. ¿Cuál es?', opts:['e (Euler)','√2','π (Pi)','φ (Phi)'], a:2, exp:'Pi (π ≈ 3,14159...) relaciona el diámetro de un círculo con su circunferencia (C = π·d).' },
  ],
  sabias: [
    { q:'¿Sabías que la miel nunca caduca? Se ha encontrado miel comestible en tumbas egipcias de hace...', opts:['500 años','1.000 años','3.000 años','500 años'], a:2, exp:'¡Sí! Se encontró miel en las tumbas de los faraones con más de 3.000 años y aún era comestible.' },
    { q:'¿Sabías que los pulpos tienen...?', opts:['Un corazón','Dos corazones','Tres corazones','Cuatro corazones'], a:2, exp:'¡Tres corazones! Dos bombean sangre a las branquias y uno al resto del cuerpo.' },
    { q:'¿Sabías que el sonido de un trueno viaja a unos 340 m/s? ¿Cuántos segundos entre el rayo y el trueno equivalen a 1 km?', opts:['1 segundo','3 segundos','5 segundos','10 segundos'], a:1, exp:'Cada 3 segundos de diferencia = 1 km de distancia. A 340 m/s, 1000 m ÷ 340 ≈ 3 segundos.' },
    { q:'¿Sabías que las vacas producen más leche cuando...?', opts:['Escuchan música clásica','Miran películas','Hacen ejercicio','Comen más hierba'], a:0, exp:'Estudios demuestran que la música clásica y relajante aumenta la producción de leche en vacas.' },
    { q:'¿Sabías que Cleopatra vivió más cerca en el tiempo de...?', opts:['La construcción de las pirámides','El nacimiento de Cristo','La Luna de miel del primer ser humano','El Imperio Romano'], a:3, exp:'Cleopatra (69-30 a.C.) vivió más cerca de nosotros que de la construcción de las pirámides (~2560 a.C.).' },
    { q:'¿Sabías que el corazón de una ballena azul es tan grande que...?', opts:['Cabe una persona de pie','Pesa como un coche','Un humano podría nadar por su aorta','Todas son correctas'], a:3, exp:'¡Todo correcto! El corazón de una ballena azul pesa ~180 kg y su aorta es lo suficientemente grande para un humano.' },
    { q:'¿Sabías que los árboles se comunican entre sí bajo tierra a través de...?', opts:['Señales eléctricas','Raíces conectadas','La red de hongos micorrícicos','Ondas de radio naturales'], a:2, exp:'La "Wood Wide Web": los hongos micorrícicos conectan árboles de un bosque, permitiéndoles compartir nutrientes.' },
    { q:'¿Sabías que si quitaras todo el espacio vacío de los átomos del cuerpo humano, toda la humanidad cabría en...?', opts:['Un estadio de fútbol','Una taza de café','Un terrón de azúcar','Una pelota de golf'], a:2, exp:'Todo el espacio vacío entre partículas subatómicas es enorme. Sin ese vacío, toda la humanidad cabría en un terrón de azúcar.' },
    { q:'¿Sabías que los flamencos son rosados porque...?', opts:['Nacen así','Comen carotenoides en crustáceos y algas','Su piel produce ese pigmento','Se tiñen con barro especial'], a:1, exp:'Los flamencos son blancos de nacimiento. Su color rosado viene de los carotenoides de las algas y camarones que comen.' },
    { q:'¿Sabías que el idioma con más hablantes nativos del mundo es...?', opts:['Inglés','Español','Mandarín','Hindi'], a:2, exp:'El mandarín chino tiene ~920 millones de hablantes nativos. El inglés es el más hablado en total (como L2).' },
  ],
  probable: [
    { q:'Si lanzas una moneda al aire 10 veces y sale cara todas las veces, en el lanzamiento 11... ¿qué es más probable?', opts:['Cara, sigue la racha','Cruz, tiene que compensar','Las dos tienen la misma probabilidad','Depende de la moneda'], a:2, exp:'¡Igual! Cada lanzamiento es independiente. La probabilidad siempre es 50/50 sin importar el historial.' },
    { q:'¿Qué es más probable en España?', opts:['Que te toque el Gordo de Navidad','Que te caiga un rayo en la vida','Que mueras en accidente de tráfico','Que seas la persona más alta de tu ciudad'], a:2, exp:'La probabilidad de morir en accidente de tráfico (~1 en 100) supera ampliamente las demás opciones.' },
    { q:'En una sala con 23 personas, ¿cuál es la probabilidad de que dos cumplan años el mismo día?', opts:['Muy baja (~5%)','Baja (~20%)','Media (~40%)','Alta (~50% o más)'], a:3, exp:'¡Más del 50%! Es la paradoja del cumpleaños. Con 23 personas hay 253 pares posibles.' },
    { q:'¿Qué opción tiene más probabilidad de ocurrir en una partida de ajedrez entre dos principiantes?', opts:['Tablas','Victoria de las blancas','Victoria de las negras','Abandono antes del turno 10'], a:1, exp:'Las blancas tienen una ligera ventaja estadística (mueven primero), y entre principiantes suele ganar quien ataca.' },
    { q:'Si entras en un ascensor con un desconocido, ¿qué es estadísticamente lo más probable?', opts:['Que os miréis a los ojos','Que ambos miréis el teléfono','Que miréis los números del piso','Que se establezca una conversación'], a:2, exp:'La mayoría de las personas en un ascensor fijan la vista en los números del piso para evitar el contacto.' },
    { q:'¿Qué es más probable al pedir un taxi en una ciudad grande?', opts:['Que llegue en menos de 3 minutos','Que el conductor conozca un atajo','Que pongan la radio','Que el trayecto tarde más de lo GPS estimado'], a:3, exp:'El tráfico urbano real casi siempre supera las estimaciones del GPS por semáforos, paradas, etc.' },
    { q:'Si un medicamento tiene un 95% de efectividad y lo toman 1.000 personas, ¿cuántas probablemente no responderán al tratamiento?', opts:['5','50','95','150'], a:1, exp:'Si el 95% funciona, el 5% no. 5% de 1.000 = 50 personas sin respuesta al tratamiento.' },
    { q:'¿Qué es más probable en una conversación por WhatsApp?', opts:['Que el otro lea y responda de inmediato','Que lea y tarde 10+ minutos','Que los dos dobles azules aparezcan y no llegue respuesta','Que el mensaje falle al enviarse'], a:2, exp:'El "visto" sin respuesta inmediata es la situación más estadísticamente documentada del WhatsApp moderno.' },
    { q:'¿Cuál de estas palabras es más probable que esté mal escrita en un texto largo?', opts:['"Haber" vs "a ver"','La palabra más larga','La última palabra','La primera palabra'], a:0, exp:'Las confusiones gramaticales como "haber/a ver", "por qué/porque" son los errores más frecuentes en textos.' },
    { q:'Si 100 personas eligen un número del 1 al 10 aleatoriamente, ¿cuál será el más elegido?', opts:['7','3','1','10'], a:0, exp:'El 7 es estadísticamente el número más elegido "aleatoriamente" por humanos. Seguido del 3. Los humanos no somos aleatorios.' },
  ],
};
