/* ═══════════════════════════════════════════════════
   questions_hard.js — Preguntas de dificultad DIFÍCIL
   diff: "hard"

   Para añadir preguntas difíciles:
     {q:"pregunta", a:["op1","op2","op3","op4"], c:índice_correcto, cat:"cat", diff:"hard"}

   Categorías disponibles: geo, sci, hist, art, sport, ent, food, tech
═══════════════════════════════════════════════════ */

const QUESTIONS_HARD = [
  {q:"¿Qué país tiene más islas del mundo?",           a:["Noruega","Filipinas","Indonesia","Suecia"],      c:3, cat:"geo",  diff:"hard"},
  {q:"¿Cuál es el desierto más grande del mundo?",     a:["Sahara","Gobi","Atacama","Antártida"],          c:3, cat:"geo",  diff:"hard"},
  {q:"¿Cuál es el lago más profundo del mundo?",       a:["Titicaca","Baikal","Superior","Victoria"],      c:1, cat:"geo",  diff:"hard"},
  {q:"¿Cuántos litros de sangre tiene el cuerpo humano?",a:["3","5","7","10"],                             c:1, cat:"sci",  diff:"hard"},
  {q:"¿Qué animal tiene más dientes?",                 a:["Tiburón","Cocodrilo","Delfín","Caracol"],        c:3, cat:"sci",  diff:"hard"},
  {q:"¿Cuántas vértebras tiene la columna humana?",    a:["24","30","33","36"],                             c:2, cat:"sci",  diff:"hard"},
  {q:"¿Qué imperio fue el más grande de la historia?", a:["Romano","Mongol","Británico","Persa"],           c:2, cat:"hist", diff:"hard"},
  {q:"¿En qué año se publicó 'El Quijote' (primera parte)?",a:["1495","1605","1615","1620"],               c:1, cat:"art",  diff:"hard"},
  {q:"¿Cuál es la especia más cara del mundo?",        a:["Vainilla","Trufa","Azafrán","Cardamomo"],        c:2, cat:"food", diff:"hard"},
  {q:"¿Qué significa 'Wi-Fi'?",                        a:["Wireless Fidelity","Wide Frequency","Wireless Fiber","None (es una marca)"],c:3,cat:"tech",diff:"hard"},
  {q:"¿Cuál es el lenguaje de programación más popular según Stack Overflow 2023?",a:["Python","JavaScript","Java","C++"],c:1,cat:"tech",diff:"hard"},
  {q:"¿Cuántos lados tiene un dodecágono?",            a:["10","11","12","14"],                             c:2, cat:"sci",  diff:"hard"},
  {q:"¿Por cuántos países pasa el río Amazonas?",      a:["2","3","4","5"],                                 c:1, cat:"geo",  diff:"hard"},
  {q:"¿Cuál es la capital de Sudáfrica?",              a:["Ciudad del Cabo","Johannesburgo","Pretoria","Durban"],c:2,cat:"geo",diff:"hard"},
  {q:"¿Cuál es el volcán activo más alto del mundo?",  a:["Etna","Kilauea","Ojos del Salado","Cotopaxi"],   c:3, cat:"geo",  diff:"hard"},
  {q:"¿Cuál es el desierto más frío del mundo?",       a:["Atacama","Gobi","Antártida","Sahara"],           c:2, cat:"geo",  diff:"hard"},
  {q:"¿Cuál es la montaña más alta de Europa?",        a:["Mont Blanc","Matterhorn","Monte Rosa","Elbrus"], c:3, cat:"geo",  diff:"hard"},
  {q:"¿Qué animal tiene la sangre azul?",              a:["Pulpo","Calamar","Cangrejo","Todas son correctas"],c:3,cat:"sci",diff:"hard"},
  {q:"¿Cuántos lóbulos tiene el cerebro humano?",      a:["2","4","6","8"],                                 c:1, cat:"sci",  diff:"hard"},
  {q:"¿Qué planeta rota al revés respecto a la mayoría?",a:["Marte","Júpiter","Venus","Neptuno"],           c:2, cat:"sci",  diff:"hard"},
  {q:"¿Cuántos pares de cromosomas tiene el ser humano?",a:["21","23","25","46"],                           c:1, cat:"sci",  diff:"hard"},
  {q:"¿Cuántos músculos tiene el cuerpo humano aproximadamente?",a:["200","400","600","800"],               c:2, cat:"sci",  diff:"hard"},
  {q:"¿Quién fue el último faraón de Egipto?",         a:["Cleopatra","Nefertiti","Tutankamón","Ramsés III"],c:0,cat:"hist",diff:"hard"},
  {q:"¿En qué año se firmó la Constitución de EE.UU.?",a:["1776","1783","1787","1791"],                    c:2, cat:"hist", diff:"hard"},
  {q:"¿En qué año cayó el Imperio Romano de Occidente?",a:["376","410","476","550"],                       c:2, cat:"hist", diff:"hard"},
  {q:"¿En qué año se publicó el Manifiesto Comunista?",a:["1840","1848","1856","1862"],                    c:1, cat:"hist", diff:"hard"},
  {q:"¿Qué civilización inventó la escritura cuneiforme?",a:["Egipcia","China","Sumeria","Maya"],          c:2, cat:"hist", diff:"hard"},
  {q:"¿Cuántos años duró la Guerra de los Cien Años?", a:["100","116","87","124"],                         c:1, cat:"hist", diff:"hard"},
  {q:"¿Qué pueblo construyó Stonehenge?",              a:["Romanos","Celtas","Vikingos","Cultura desconocida"],c:3,cat:"hist",diff:"hard"},
  {q:"¿Cuántos libros tiene la Biblia (canon católico)?",a:["66","72","73","77"],                           c:2, cat:"art",  diff:"hard"},
  {q:"¿Quién compuso la ópera 'La Traviata'?",         a:["Puccini","Mozart","Verdi","Wagner"],             c:2, cat:"art",  diff:"hard"},
  {q:"¿Qué novela comienza con 'Llámame Ismael'?",     a:["El gran Gatsby","Moby Dick","Ahab","Billy Budd"],c:1,cat:"art",diff:"hard"},
  {q:"¿Cuánto mide un campo de fútbol reglamentario (largo máximo)?",a:["100m","110m","120m","130m"],       c:2, cat:"sport",diff:"hard"},
  {q:"¿Cuántos puntos vale un try en rugby?",           a:["3","4","5","7"],                                c:2, cat:"sport",diff:"hard"},
  // ── ENTRETENIMIENTO (nuevas) ──
  {q:"¿Cuántas películas tiene el universo Marvel (MCU) hasta 2023?",a:["25","31","33","35"],               c:2, cat:"ent",  diff:"hard"},
  {q:"¿Quién dirige el estudio de animación Pixar?",    a:["Steven Spielberg","Disney","John Lasseter / Pete Docter","James Cameron"],c:1,cat:"ent",diff:"hard"},
  {q:"¿Cuál es el ingrediente base del miso?",          a:["Arroz fermentado","Soja fermentada","Algas","Tofu"],c:1,cat:"food",diff:"hard"},
  {q:"¿De qué flor se extrae el azafrán?",              a:["Rosa","Lavanda","Crocus","Jazmín"],              c:2, cat:"food", diff:"hard"},
  {q:"¿De qué país es el croissant?",                   a:["Francia","Austria","Bélgica","Suiza"],           c:1, cat:"food", diff:"hard"},
  {q:"¿Qué protocolo usa el correo electrónico para enviar?",a:["HTTP","FTP","SMTP","POP3"],                c:2, cat:"tech", diff:"hard"},
  {q:"¿En qué año nació internet (ARPANET)?",          a:["1959","1969","1979","1989"],                     c:1, cat:"tech", diff:"hard"},
  {q:"¿Cuántos píxeles tiene una imagen 4K de ancho?", a:["1920","2560","3840","4096"],                     c:2, cat:"tech", diff:"hard"},
  // ── CIENCIA EXTRA ──
  {q:"¿Qué planeta tiene la mayor cantidad de lunas conocidas?",a:["Júpiter","Saturno","Urano","Neptuno"],  c:1, cat:"sci",  diff:"hard"},
  {q:"¿Qué animal tiene la gestación más larga?",      a:["Elefante","Rinoceronte","Ballena azul","Jirafa"],c:0,cat:"sci",diff:"hard"},
  {q:"¿En qué año se proclamó la Primera República española?",a:["1868","1873","1875","1931"],             c:1, cat:"hist", diff:"hard"},
  {q:"¿Qué cultura inventó el cero como concepto matemático?",a:["Egipcia","Griega","Maya e India","Romana"],c:2,cat:"hist",diff:"hard"},
  // ── GEOGRAFÍA EXTRA ──
  {q:"¿Cuál es el país con más costa del mundo?",       a:["Noruega","Australia","Canadá","Rusia"],         c:2, cat:"geo",  diff:"hard"},
];
