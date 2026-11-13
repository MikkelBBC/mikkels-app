/* Forklaringer til Systemprogrammering (SW3SYS) og AI-værktøjer. Eksemplerne er bevidst andre end i quizzen. */
"use strict";

Object.assign(LESSONS, {
  "sys/basis": [
    { kind: "read", title: "User mode og kernel mode",
      body: "CPU'en kører i to tilstande. Almindelige programmer kører i <b>user mode</b> og må ikke røre hardware direkte. Kernen kører i <b>kernel mode</b> og må alt, fx ændre page tables, slå interrupts fra og tale med enheder.<br><br>Når et program skal bruge noget fra kernen, laver det et <b>system call</b>. Det er et kontrolleret hop ind i kernen.",
      vis: { type: "flow", steps: ["Dit program kalder read()", "libc laver et system call (trap)", "CPU skifter til kernel mode", "Kernen og driveren henter data", "Tilbage til user mode med resultatet"], hl: 2 } },
    { kind: "check", q: "Hvad er hurtigst: et almindeligt funktionskald i dit eget program eller et system call?",
      o: ["Funktionskaldet, et system call skal skifte til kernel mode", "System call, kernen kører hurtigere end programmer", "De er lige hurtige, begge er bare et hop", "System call, fordi det går direkte til hardware"], a: 0,
      e: "Et system call skal skifte tilstand, gemme registre og tjekke argumenter. Et funktionskald er bare et hop i samme program." },
    { kind: "read", title: "Rettigheder: rwx og tal",
      body: "Hver fil har rettigheder for <b>ejer</b>, <b>gruppe</b> og <b>andre</b>. r = 4, w = 2, x = 1, og man lægger sammen. <code>chmod 640 fil</code> giver ejer rw-, gruppe r-- og andre ingenting. root har UID 0 og må alt.",
      vis: { type: "table", head: ["Tal", "Betyder", "Regnestykke"], rows: [["7", "rwx", "4 + 2 + 1"], ["6", "rw-", "4 + 2"], ["5", "r-x", "4 + 1"], ["4", "r--", "4"], ["0", "---", "0"]] } },
    { kind: "check", q: "Hvad betyder `chmod 750 run.sh`?",
      o: ["Ejer rwx, gruppe r-x, andre ingenting", "Ejer rwx, gruppe rw-, andre ingenting", "Ejer rw-, gruppe r-x, andre r--", "Alle må læse og køre, kun ejer må skrive"], a: 0,
      e: "7 = 4+2+1 = rwx, 5 = 4+1 = r-x, 0 = ---." },
    { kind: "read", title: "Scripts og krydskompilering",
      body: "<code>#!/bin/bash</code> øverst i et script er en <b>shebang</b>. Den fortæller, hvilket program der skal fortolke filen.<br><br>Når du bygger på din PC til en Raspberry Pi, <b>krydskompilerer</b> du. Du skal bruge en compiler til target-arkitekturen (en toolchain) og en <b>sysroot</b>: en mappe med target-systemets headers og biblioteker." },
  ],

  "sys/proc": [
    { kind: "read", title: "Processer og tilstande",
      body: "En proces er et kørende program med sit eget adresserum og et PID. Den skifter mellem tilstande. Laver den et blokerende kald (fx venter på disk eller netværk), går den til <b>waiting</b>, til data er klar.",
      vis: { type: "flow", steps: ["new", "ready (venter på CPU)", "running", "waiting (venter på I/O)", "terminated"], hl: 2,
        note: "Fra running kan den gå til ready (tiden er brugt), waiting (I/O) eller terminated. Fra waiting går den tilbage til ready." } },
    { kind: "read", title: "fork() kopierer processen",
      body: "<code>fork()</code> laver en kopi af processen. Begge fortsætter fra linjen efter fork. Returværdien afgør, hvem man er: <b>0 i barnet</b>, <b>barnets PID i forælderen</b> og −1 ved fejl. Barnet får en kopi af hukommelsen og de åbne file descriptors, men sit eget PID.",
      code: `pid_t pid = fork();
if (pid == 0)      printf("barn\\n");
else if (pid > 0)  printf("forælder, barn = %d\\n", pid);
else               perror("fork");` },
    { kind: "steps", title: "Tre fork() i træk",
      body: "Hver fork fordobler antallet af processer, fordi alle eksisterende processer kører den.",
      code: `fork();
fork();
fork();
printf("x\\n");`,
      rows: [["Start", "1 proces"], ["Efter fork 1", "2 processer"], ["Efter fork 2", "4 processer"], ["Efter fork 3", "8 processer"]],
      outro: "Alle 8 kører printf, så \"x\" skrives <b>8 gange</b>. Generelt giver n fork() i træk 2ⁿ processer." },
    { kind: "check", q: "Hvor mange linjer skrives i alt?",
      code: `if (fork() == 0) printf("barn\\n");
else printf("forælder\\n");`,
      o: ["2, én fra hver proces", "1, kun forælderen skriver", "1, kun barnet skriver", "4, begge skriver begge linjer"], a: 0,
      e: "Efter fork er der to processer. Barnet får 0 og skriver \"barn\", forælderen får PID og skriver \"forælder\"." },
    { kind: "read", title: "exec, wait, zombier og forældreløse",
      body: "<code>execvp()</code> <b>erstatter</b> programmet i processen med et nyt. PID er det samme. fork + exec er måden en shell starter programmer på.<br><br>Forælderen skal kalde <code>waitpid()</code> for at hente barnets exit-status. Indtil da er et afsluttet barn en <b>zombie</b>. Dør forælderen først, adopteres barnet af init/systemd (PID 1).<br><br>IPC findes i to hovedformer: <b>shared memory</b> (hurtigt, men kræver synkronisering) og <b>message passing</b> (pipes, køer, sockets)." },
  ],

  "sys/lambda": [
    { kind: "read", title: "Lambda: en funktion du skriver på stedet",
      body: "En lambda skrives <code>[capture](parametre) { krop }</code>. Den bruges typisk der, hvor en funktion skal gives videre, fx til sortering.",
      code: `std::vector<int> v{4, 1, 3};
std::sort(v.begin(), v.end(),
          [](int a, int b) { return a < b; });  // stigende` },
    { kind: "steps", title: "Capture by value og by reference",
      body: "Capture-listen bestemmer, hvordan lambdaen ser variabler udenfor.",
      code: `int x = 1;
auto byVal = [x]  { return x; };
auto byRef = [&x] { return x; };
x = 10;`,
      rows: [
        ["[x]", "kopierer x, da lambdaen blev lavet → byVal() giver 1"],
        ["[&x]", "refererer til selve x → byRef() giver 10"],
        ["mutable", "tillader lambdaen at ændre sin egen kopi"],
      ],
      outro: "Faren ved <code>[&amp;]</code>: gemmes lambdaen og kaldes, efter variablerne er gået ud af scope, peger referencerne ud i ingenting (<b>dangling</b>)." },
    { kind: "check", q: "Hvad udskrives?",
      code: `int a = 2;
auto f = [a]() { return a * 10; };
a = 5;
std::cout << f();`,
      o: ["20", "50", "2", "5"], a: 0,
      e: "[a] kopierer a, da lambdaen blev lavet (a = 2). At a senere bliver 5, ændrer ikke kopien." },
    { kind: "read", title: "Closures og higher-order functions",
      body: "Lambda-objektet plus de variabler, det har fanget, kaldes en <b>closure</b>. En <b>higher-order function</b> tager eller returnerer en funktion, fx std::sort, std::for_each, eller en funktion der laver nye funktioner.<br><br><code>std::function&lt;int(int)&gt;</code> kan gemme alt, der kan kaldes med den signatur: lambdas, funktionspointere og funktionsobjekter.",
      code: `auto makeAdder(int n) {
  return [n](int x) { return x + n; };
}
auto add3 = makeAdder(3);
std::cout << add3(4);   // 7` },
    { kind: "check", q: "Hvilken lambda tæller lige tal med `std::count_if(v.begin(), v.end(), ???)`?",
      o: ["[](int x) { return x % 2 == 0; }", "[](int x) { return x / 2 == 0; }", "[](int x) { return x % 2 == 1; }", "[](int x) { x % 2 == 0; }"], a: 0,
      e: "x % 2 er resten ved division med 2. Den er 0 for lige tal. Den sidste mangler return og returnerer derfor ingenting." },
  ],

  "sys/threads": [
    { kind: "read", title: "Tråde deler det meste",
      body: "Tråde i samme proces deler <b>heap, globale variabler og åbne filer</b>. Hver tråd har sin <b>egen stack</b> og egne registre. Det gør tråde billigere end processer, men delte data skal beskyttes.<br><br>Linux bruger <b>one-to-one</b>: hver tråd er en kernel-tråd. <code>thread_local</code> giver hver tråd sin egen kopi af en variabel.",
      code: `std::thread t([] { work(); });
t.join();   // vent på at tråden er færdig
// destrueres t uden join() eller detach(): std::terminate()` },
    { kind: "steps", title: "Amdahls lov",
      body: "Kun den parallelle del P bliver hurtigere med flere kerner N. Speedup = 1 / ((1 − P) + P / N). Eksempel med P = 0,5 og N = 4:",
      rows: [
        ["Seriel del", "1 − 0,5 = 0,5"],
        ["Parallel del", "0,5 / 4 = 0,125"],
        ["Speedup", "1 / (0,5 + 0,125) = 1 / 0,625 = 1,6"],
        ["Uendeligt mange kerner", "1 / 0,5 = 2"],
      ],
      outro: "Den serielle del sætter loftet. Er halvdelen seriel, bliver programmet aldrig mere end 2 gange hurtigere." },
    { kind: "check", q: "Amdahl: 90 % af et program kan paralleliseres. Hvad er den maksimale speedup med uendeligt mange kerner?",
      o: ["10", "90", "9", "Uendelig"], a: 0,
      e: "Maks = 1 / (1 − P) = 1 / 0,1 = 10. De sidste 10 % kører stadig serielt." },
    { kind: "read", title: "Scheduling",
      body: "<b>FCFS</b>: i ankomstrækkefølge. Et langt job forrest får alle korte til at vente (<b>convoy effect</b>). <b>SJF</b>: korteste først giver mindst gennemsnitlig ventetid, men kræver at man kender længderne. <b>Round robin</b>: hver får et fast tidsstykke på skift.<br><br>Linux nice-værdier går fra −20 (højest prioritet) til 19 (lavest).",
      vis: { type: "table", head: ["Jobs 8, 2, 2 ms", "Ventetider", "Gennemsnit"], rows: [["FCFS: 8, 2, 2", "0, 8, 10", "6 ms"], ["SJF: 2, 2, 8", "0, 2, 4", "2 ms"]], hl: 1 } },
    { kind: "check", q: "Hvad deler to tråde i samme proces IKKE?",
      o: ["Deres stack", "Heapen", "Globale variabler", "Åbne file descriptors"], a: 0,
      e: "Hver tråd har sin egen stack til lokale variabler og funktionskald. Resten er fælles." },
  ],

  "sys/sync": [
    { kind: "steps", title: "Race condition: et tal går tabt",
      body: "<code>counter++</code> er tre trin: læs, læg 1 til, skriv. To tråde kan blande trinene. counter starter på 5:",
      rows: [
        ["Tråd 1", "læser 5"],
        ["Tråd 2", "læser 5"],
        ["Tråd 1", "skriver 6"],
        ["Tråd 2", "skriver 6"],
      ],
      outro: "To optællinger, men counter er kun steget med 1. Resultatet afhænger af timingen. Det er en <b>race condition</b>." },
    { kind: "read", title: "Critical section og mutex",
      body: "Koden, der rører delte data, er en <b>critical section</b>. En løsning skal give <b>mutual exclusion</b> (kun én ad gangen), <b>progress</b> (nogen kommer altid ind) og <b>bounded waiting</b> (ingen venter for evigt).<br><br>En mutex klarer det. Brug <code>std::lock_guard</code>: den låser op i destruktoren, også hvis der kastes en exception. Låse bygges på atomiske instruktioner som test-and-set og compare-and-swap.",
      code: `std::mutex m;
void inc() {
  std::lock_guard<std::mutex> lk(m);
  counter++;
}   // låses op her` },
    { kind: "read", title: "Condition variables",
      body: "En condition variable lader en tråd sove, til en betingelse er sand. <code>wait</code> kræver en <code>std::unique_lock</code>, fordi den skal låse op, mens den sover, og låse igen, når den vågner. Tråde kan vågne uden grund (<b>spurious wakeup</b>), så betingelsen tjekkes altid igen.",
      code: `std::unique_lock<std::mutex> lk(m);
cv.wait(lk, [] { return !queue.empty(); });
// et andet sted: cv.notify_one();` },
    { kind: "read", title: "Semaforer",
      body: "En semafor er en tæller. <b>wait (P)</b> tæller ned, og står den på 0, blokerer tråden. <b>signal (V)</b> tæller op og vækker en ventende. En semafor startet på 1 virker som en lås. En semafor startet på N styrer adgang til N ens ressourcer.<br><br>Når mange tråde venter på samme lås, kaldes det <b>lock contention</b>." },
    { kind: "check", q: "En semafor starter på 3. Fire tråde kalder wait() lige efter hinanden. Hvor mange blokerer?",
      o: ["1", "0", "3", "4"], a: 0,
      e: "De tre første tæller ned til 0 og kommer igennem. Den fjerde møder 0 og blokerer, til nogen kalder signal." },
    { kind: "check", q: "Hvad er en race condition?",
      o: ["Resultatet afhænger af timingen mellem tråde", "To tråde kører præcis lige hurtigt", "En tråd venter for evigt på en lås", "Programmet bruger for meget CPU"], a: 0,
      e: "Når flere tråde rører samme data uden synkronisering, afhænger resultatet af, hvordan de tilfældigvis bliver flettet." },
  ],

  "sys/deadlock": [
    { kind: "read", title: "Fire betingelser, og alle skal være der",
      body: "Deadlock er, når tråde venter på hinanden i ring, og ingen kan komme videre. Det kræver <b>alle fire</b> Coffman-betingelser:<br><br>1. <b>Mutual exclusion</b>: ressourcen kan kun bruges af én.<br>2. <b>Hold and wait</b>: man holder noget og venter på mere.<br>3. <b>No preemption</b>: man kan ikke tage ressourcen fra nogen.<br>4. <b>Circular wait</b>: en ring af ventende.<br><br>Bryd én, så er deadlock umulig." },
    { kind: "read", title: "Resource Allocation Graph",
      body: "Tråde er cirkler og ressourcer firkanter. Pil fra tråd til ressource = <b>venter på</b>. Pil fra ressource til tråd = <b>holdes af</b>. Med én instans pr. ressource betyder en cykel <b>deadlock</b>. Med flere instanser betyder en cykel kun, at der <b>måske</b> er deadlock.",
      vis: { type: "graph", directed: true, squares: ["R1", "R2"], nodes: { T1: [70, 40], R2: [230, 40], T2: [230, 150], R1: [70, 150] },
        edges: [["T1", "R2"], ["R2", "T2"], ["T2", "R1"], ["R1", "T1"]], hl: ["T1-R2", "R2-T2", "T2-R1", "R1-T1"],
        note: "T1 holder R1 og venter på R2. T2 holder R2 og venter på R1. Cykel = deadlock." } },
    { kind: "read", title: "Hvad gør man ved det?",
      body: "<b>Prevention</b>: bryd en betingelse. Lås altid i samme rækkefølge, så kan der ikke opstå en ring (circular wait). Eller tag alle låse på én gang (bryder hold and wait).<br><b>Avoidance</b>: giv kun en ressource, hvis systemet bliver i en sikker tilstand. Banker's algorithm er eksemplet.<br><b>Detection</b>: find cykler og ryd op.<br><br>I C++ låser <code>std::scoped_lock lk(m1, m2);</code> flere mutexer på én gang uden risiko for deadlock." },
    { kind: "read", title: "Dining philosophers",
      body: "Fem filosoffer sidder om et bord med én gaffel mellem hver. For at spise skal man bruge begge sine gafler. Tager alle venstre gaffel samtidig, venter alle for evigt på højre: deadlock.<br><br>Løsninger: én filosof tager højre gaffel først (bryder ringen), højst fire må sidde ved bordet ad gangen, eller man tager begge gafler i ét atomisk skridt." },
    { kind: "check", q: "En regel siger, at en tråd skal have ALLE sine låse på én gang, før den starter. Hvilken betingelse brydes?",
      o: ["Hold and wait", "Circular wait", "Mutual exclusion", "No preemption"], a: 0,
      e: "Man kan ikke længere holde nogle låse og vente på flere. Enten får man dem alle, eller også venter man uden at holde noget." },
    { kind: "check", q: "En RAG har en cykel, men en af ressourcerne i cyklen har 2 instanser. Hvad kan man sige?",
      o: ["Der er måske deadlock, det skal undersøges", "Der er helt sikkert deadlock", "Der kan aldrig være deadlock", "Det betyder, at grafen er tegnet forkert"], a: 0,
      e: "Kun med én instans pr. ressource er en cykel det samme som deadlock. Med flere kan en ledig instans bryde ventetiden." },
  ],

  "sys/fileio": [
    { kind: "read", title: "File descriptors",
      body: "I Linux er næsten alt en fil, og et åbent stykke I/O er et lille heltal: en <b>file descriptor</b>. 0 er stdin, 1 er stdout og 2 er stderr. <code>open()</code> giver den laveste ledige fd eller −1 ved fejl (og sætter errno).<br><br><code>read()</code> returnerer antal læste bytes, <b>0 ved end of file</b> og −1 ved fejl. Den kan godt læse færre bytes end bedt om.",
      code: `int fd = open("data.txt", O_RDONLY);
char buf[100];
ssize_t n;
while ((n = read(fd, buf, sizeof buf)) > 0)
  write(1, buf, n);   // 1 = stdout
close(fd);` },
    { kind: "check", q: "Et nyt program har kun 0, 1 og 2 åbne og kalder open(), som lykkes. Hvilken fd får det?",
      o: ["3", "0", "1", "−1"], a: 0,
      e: "open giver den laveste ledige fd. 0, 1 og 2 er optaget af stdin, stdout og stderr." },
    { kind: "read", title: "Blocking og non-blocking",
      body: "Normalt <b>blokerer</b> read, til der er data. Sætter man <code>O_NONBLOCK</code>, returnerer read straks <b>−1 med errno EAGAIN</b>, hvis intet er klar. Flaget sættes med fcntl uden at slette de andre flag.",
      code: `int flags = fcntl(fd, F_GETFL);
fcntl(fd, F_SETFL, flags | O_NONBLOCK);` },
    { kind: "read", title: "poll() og triggering",
      body: "<code>poll()</code> venter på, at <b>én af flere</b> fds bliver klar, med en timeout. Så kan ét program fx lytte på både en sensor og et netværk uden at spilde CPU.<br><br><b>Level-triggered</b>: man får besked, så længe der er data. <b>Edge-triggered</b>: man får kun besked i det øjeblik, tilstanden ændrer sig.<br><br><code>ioctl()</code> bruges til enhedsspecifik kontrol, som ikke passer ind i read og write." },
    { kind: "check", q: "`write(fd, buf, 100)` returnerer 60. Hvad betyder det?",
      o: ["Kun 60 bytes blev skrevet, resten skal sendes igen", "Der opstod en fejl, og intet blev skrevet", "Alle 100 bytes blev skrevet, 60 er en statuskode", "Filen er fuld, og man skal lukke den"], a: 0,
      e: "write returnerer, hvor mange bytes der faktisk blev skrevet. Det kan være færre end bedt om, og så skal man skrive resten i en løkke." },
  ],

  "sys/msg": [
    { kind: "read", title: "Send beskeder i stedet for at dele data",
      body: "Ved message passing deler tråde ikke variabler. De sender beskeder gennem en kø. Den klassiske form er <b>producer-consumer</b> med en <b>bounded buffer</b>: én mutex og to condition variables, \"ikke fuld\" og \"ikke tom\".",
      vis: { type: "flow", steps: ["Producer laver en besked", "push: venter hvis køen er fuld", "Kø (bounded buffer)", "pop: venter hvis køen er tom", "Consumer behandler beskeden"], hl: 2 } },
    { kind: "read", title: "std::variant som beskedtype",
      body: "<code>std::variant&lt;Start, Stop, Data&gt;</code> indeholder <b>præcis én</b> af typerne ad gangen. Det er en sum type. Bruger man <code>std::get</code> med den forkerte type, kastes std::bad_variant_access. <code>std::visit</code> kalder den rigtige funktion for den type, der ligger i.",
      code: `std::variant<int, std::string> v = "hej";
if (std::holds_alternative<std::string>(v))
  std::cout << std::get<std::string>(v);
std::visit([](auto& x) { std::cout << x; }, v);` },
    { kind: "check", q: "Hvad giver `std::holds_alternative<int>(v)`, når v er lavet med `std::variant<int, std::string> v = 3;`?",
      o: ["true", "false", "3", "Den kaster en exception"], a: 0,
      e: "v indeholder en int (3), så holds_alternative<int> er sand. Den returnerer en bool, ikke værdien." },
    { kind: "read", title: "Flyt i stedet for at kopiere",
      body: "<code>std::move(x)</code> flytter ingenting selv. Den laver x om til en rvalue, så move-konstruktøren må stjæle indholdet. Bagefter er x i en gyldig, men uspecificeret tilstand.<br><br>Sender man <code>std::unique_ptr&lt;Message&gt;</code> gennem køen, er der altid præcis én ejer, og intet kopieres. En <b>message broker</b> er en mellemmand, der router beskeder fra afsendere til modtagere (pub/sub)." },
    { kind: "check", q: "Efter `std::string b = std::move(a);`, hvad kan du regne med om a?",
      o: ["Den er gyldig, men indholdet er uspecificeret", "Den indeholder stadig den gamle tekst", "Den er slettet, og at bruge den crasher", "Den peger nu på samme tekst som b"], a: 0,
      e: "Et objekt, der er flyttet fra, må destrueres eller få en ny værdi, men man må ikke regne med, hvad det indeholder." },
  ],

  "sys/serial": [
    { kind: "read", title: "I2C: to ledninger og adresser",
      body: "I2C bruger <b>SDA</b> (data) og <b>SCL</b> (clock). Mange enheder deler samme to ledninger, og masteren vælger enhed med en 7-bit <b>adresse</b>. Efter hver byte svarer modtageren med <b>ACK</b> eller NACK.<br><br>Linjerne er <b>open-drain</b>: enhederne kan kun trække dem lave. <b>Pull-up-modstande</b> trækker dem høje igen." },
    { kind: "read", title: "SPI: hurtigere, men flere ledninger",
      body: "SPI bruger <b>MOSI</b> (master ud), <b>MISO</b> (master ind), <b>SCLK</b> (clock) og én <b>CS</b> (chip select) pr. enhed. Der er ingen adresser og ingen ACK. Enheden vælges ved at trække dens CS lav. Data går begge veje samtidig (full duplex).",
      vis: { type: "table", head: ["", "I2C", "SPI"], rows: [["Ledninger", "2 (SDA, SCL)", "3 + én CS pr. enhed"], ["Vælg enhed", "adresse", "CS-ledning"], ["Kvittering", "ACK/NACK", "ingen"], ["Hastighed", "lavere", "højere"]] } },
    { kind: "check", q: "Du skal koble 3 enheder på samme SPI-bus. Hvor mange CS-ledninger skal du bruge?",
      o: ["3", "1", "2", "0, SPI bruger adresser"], a: 0,
      e: "SPI har én chip select pr. enhed. MOSI, MISO og SCLK deles." },
    { kind: "read", title: "I2C og SPI fra Linux",
      body: "<b>I2C</b> via i2c-dev: åbn bussen, vælg slaveadressen med ioctl, og brug read/write. <code>i2cdetect -y 1</code> viser, hvilke adresser der svarer på bus 1.<br><br><b>SPI</b> via spidev: åbn <code>/dev/spidev0.0</code>, udfyld en <code>struct spi_ioc_transfer</code>, og kald <code>ioctl(fd, SPI_IOC_MESSAGE(1), &amp;tr)</code>.",
      code: `int fd = open("/dev/i2c-1", O_RDWR);
ioctl(fd, I2C_SLAVE, 0x48);   // fx en temperatursensor
read(fd, buf, 2);` },
    { kind: "check", q: "Hvorfor kan to I2C-enheder med samme adresse ikke sidde på samme bus?",
      o: ["Begge ville svare, når masteren kalder adressen", "Bussen kan kun levere strøm til én enhed", "Pull-up-modstandene ville brænde af", "SPI og I2C ville komme i konflikt"], a: 0,
      e: "Masteren vælger enhed alene med adressen. Har to samme adresse, svarer begge, og data bliver blandet." },
  ],

  "sys/mem": [
    { kind: "read", title: "Virtuel hukommelse og paging",
      body: "Hver proces ser sit eget <b>virtuelle</b> adresserum. <b>MMU'en</b> oversætter virtuelle adresser til fysiske ved hjælp af processens <b>sidetabel</b>. Hukommelsen deles i sider af fast størrelse, typisk 4 KiB. <b>TLB</b> er en lille cache med de seneste oversættelser, så man ikke skal slå op i sidetabellen hver gang." },
    { kind: "steps", title: "Del en adresse i side og offset",
      body: "4 KiB = 4096 = 2¹² bytes, så de nederste 12 bit er offset. 12 bit er præcis 3 hex-cifre. Adresse 0x5C21:",
      rows: [
        ["Sidestørrelse", "4096 = 0x1000 → offset er de sidste 3 hex-cifre"],
        ["Offset", "0xC21"],
        ["Sidenummer", "resten: 0x5"],
      ],
      outro: "Sidetabellen slår side 0x5 op og finder en fysisk ramme. Offset 0xC21 lægges til rammens start." },
    { kind: "check", q: "Sidestørrelse 4 KiB. Hvad er sidenummer og offset for adressen 0x12345?",
      o: ["Side 0x12, offset 0x345", "Side 0x1, offset 0x2345", "Side 0x123, offset 0x45", "Side 0x12345, offset 0"], a: 0,
      e: "De sidste 3 hex-cifre er offset (0x345). Resten er sidenummeret (0x12)." },
    { kind: "read", title: "Fragmentering og frie huller",
      body: "Paging giver <b>intern fragmentering</b>: sidste side bliver sjældent fyldt helt. Tildeler man blokke af varierende størrelse, får man <b>ekstern fragmentering</b>: mange små huller.<br><br>Hvilket hul skal man vælge? <b>First fit</b> tager det første, der er stort nok. <b>Best fit</b> tager det mindste, der passer. <b>Worst fit</b> tager det største.",
      vis: { type: "table", head: ["Huller 10, 4, 20 KB. Behov 3 KB", "Valgt hul"], rows: [["First fit", "10 KB"], ["Best fit", "4 KB"], ["Worst fit", "20 KB"]] } },
    { kind: "read", title: "I/O, DMA og interrupts",
      body: "<b>Memory-mapped I/O</b>: enhedens registre ligger i adresserummet og læses med almindelige load/store. <b>Port-mapped I/O</b>: særlige in/out-instruktioner.<br><br><b>DMA</b> lader enheden kopiere direkte til RAM, uden at CPU'en skal flytte hver byte. CPU'en får et interrupt, når det er færdigt.<br><br>Ved et <b>interrupt</b> gemmer CPU'en sin tilstand, hopper til den rigtige <b>ISR</b> og vender tilbage bagefter. Alternativet er polling, hvor CPU'en selv spørger igen og igen." },
    { kind: "check", q: "Best fit med frie huller på 12, 5 og 8 KB. Et program skal bruge 6 KB. Hvilket hul vælges?",
      o: ["8 KB", "12 KB", "5 KB", "Intet, der er ikke plads"], a: 0,
      e: "Best fit tager det mindste hul, der er stort nok. 5 KB er for lille, så 8 KB vælges." },
  ],

  "sys/raii": [
    { kind: "read", title: "RAII: oprydning sker af sig selv",
      body: "<b>R</b>esource <b>A</b>cquisition <b>I</b>s <b>I</b>nitialization: en ressource hentes i konstruktøren og frigives i destruktoren. Når objektet går ud af scope, ryddes der op, også hvis der kastes en exception. lock_guard, fstream og smart pointers virker alle sådan.",
      code: `{
  std::ofstream f("log.txt");   // åbner filen
  f << "hej";
}   // destruktoren lukker filen her` },
    { kind: "read", title: "unique_ptr: én ejer",
      body: "<code>std::unique_ptr</code> ejer et objekt alene og sletter det i sin destruktor. Den kan <b>ikke kopieres</b>, kun <b>flyttes</b> med std::move. Bagefter er den gamle tom (nullptr).<br><br>Signaturen fortæller om ejerskab: <code>void f(std::unique_ptr&lt;T&gt; p)</code> <b>tager</b> ejerskabet (en sink). <code>void f(const T&amp;)</code> låner bare. Brug <code>std::make_unique</code> i stedet for rå new." },
    { kind: "steps", title: "shared_ptr tæller ejere",
      body: "shared_ptr har en reference-tæller. Objektet slettes, når tælleren når 0.",
      code: `auto a = std::make_shared<Sensor>();
auto b = a;
b.reset();`,
      rows: [
        ["make_shared", "use_count = 1"],
        ["auto b = a", "use_count = 2"],
        ["b.reset()", "use_count = 1"],
        ["a går ud af scope", "use_count = 0 → Sensor slettes"],
      ],
      outro: "Holder to objekter shared_ptr til <b>hinanden</b>, når tælleren aldrig 0, og ingen af dem slettes. Løsningen er at lade den ene være en <b>weak_ptr</b>. Den peger på objektet uden at tælle med." },
    { kind: "check", q: "Hvad udskrives?",
      code: `auto a = std::make_shared<int>(5);
auto b = a;
auto c = b;
std::cout << a.use_count();`,
      o: ["3", "1", "2", "5"], a: 0,
      e: "a, b og c deler samme objekt, så der er 3 ejere. 5 er værdien, ikke tælleren." },
    { kind: "check", q: "Hvad er p efter disse linjer?",
      code: `auto p = std::make_unique<int>(1);
auto q = std::move(p);`,
      o: ["nullptr, ejerskabet er flyttet til q", "En kopi af 1, ligesom q", "Udefineret, programmet crasher her", "Den peger stadig på 1, sammen med q"], a: 0,
      e: "unique_ptr kan kun have én ejer. Ved move overtager q pointeren, og p bliver tom." },
  ],

  "sys/driver": [
    { kind: "read", title: "Kernemoduler",
      body: "En driver kan skrives som et <b>kernemodul</b> (.ko), der indlæses, mens systemet kører: <code>insmod</code> indlæser, <code>rmmod</code> fjerner, og <code>lsmod</code> viser dem. Modulet har en init- og en exit-funktion.<br><br>Kernen kan ikke bruge printf. Man logger med <code>printk()</code> og læser det med <code>dmesg</code>." },
    { kind: "read", title: "Character devices",
      body: "En enhed vises som en fil i /dev. Den har et <b>major number</b>, der angiver hvilken driver, og et <b>minor number</b>, der angiver hvilken enhed driveren styrer. Driveren udfylder en <code>struct file_operations</code> med funktionspointere til open, read, write og release.",
      vis: { type: "flow", steps: ["Program kalder read(fd, buf, n)", "System call ind i kernen", "Kernen finder driveren via major number", "Driverens .read-funktion kører", "copy_to_user() lægger data i programmets buffer"], hl: 3 } },
    { kind: "check", q: "To enheder i /dev har begge major 240, men minor 0 og 1. Hvad betyder det?",
      o: ["Samme driver styrer to forskellige enheder", "To forskellige drivere deler én enhed", "Det er samme enhed, åbnet to gange", "Enhederne kører på hver sin CPU-kerne"], a: 0,
      e: "Major peger på driveren. Minor skelner mellem de enheder, den samme driver håndterer." },
    { kind: "read", title: "Grænsen mellem user og kernel",
      body: "En pointer fra et program kan være ugyldig eller pege ind i kernens hukommelse. Derfor må driveren aldrig bruge den direkte. <code>copy_to_user()</code> og <code>copy_from_user()</code> tjekker adressen og håndterer fejl sikkert. De returnerer antal bytes, der <b>ikke</b> kunne kopieres." },
    { kind: "read", title: "Interrupts i en driver",
      body: "Driveren registrerer sin interrupt handler med <code>request_irq()</code>. En ISR skal være kort og må <b>aldrig sove eller blokere</b>. Det udelukker fx mutex_lock og copy_to_user.<br><br>Blokerende read: read-funktionen kalder <code>wait_event_interruptible(kø, betingelse)</code> og sover. ISR'en sætter betingelsen og kalder <code>wake_up_interruptible(kø)</code>. Tungt arbejde kan udskydes til en workqueue eller tasklet." },
    { kind: "check", q: "Hvorfor må en ISR ikke kalde mutex_lock()?",
      o: ["Den kan sove, og en ISR må aldrig sove", "Mutexer findes kun i user space", "Den gør interruptet for hurtigt", "Den slår alle andre interrupts fra"], a: 0,
      e: "Er mutexen optaget, lægger mutex_lock tråden til at sove. En ISR kører ikke som en almindelig tråd og kan ikke planlægges igen, så den må aldrig sove." },
  ],

  "sys/build": [
    { kind: "read", title: "Make: byg kun det nødvendige",
      body: "En Makefile består af regler: <b>target: prerequisites</b> og herunder en recipe, der <b>skal starte med TAB</b>. make bygger et target om, hvis en prerequisite er <b>nyere</b> end target (ud fra filernes tidsstempler).<br><br><code>$@</code> er target, <code>$&lt;</code> er første prerequisite, og <code>$^</code> er alle. <code>.PHONY: clean</code> fortæller, at clean ikke er en fil.",
      code: `app: main.o util.o
	$(CC) -o $@ $^
%.o: %.c
	$(CC) -c $< -o $@
.PHONY: clean
clean:
	rm -f app *.o` },
    { kind: "steps", title: "Du retter util.c og kører make",
      body: "make går baglæns fra app og sammenligner tidsstempler.",
      rows: [
        ["util.o", "util.c er nyere → kompilér util.o igen"],
        ["main.o", "main.c er ikke ændret → spring over"],
        ["app", "util.o er nu nyere end app → link igen"],
      ],
      outro: "Kun én fil kompileres, og der linkes én gang. På store projekter sparer det minutter." },
    { kind: "check", q: "Med Makefilen ovenfor retter du kun main.c. Hvad bygger make om?",
      o: ["main.o og app", "Kun main.o", "main.o, util.o og app", "Ingenting, man skal køre make clean først"], a: 0,
      e: "main.o er ældre end main.c og kompileres. Så er main.o nyere end app, og der linkes igen. util.o er uændret." },
    { kind: "read", title: "CMake genererer byggefilerne",
      body: "CMake er et <b>meta-build system</b>. Du beskriver projektet i CMakeLists.txt, og CMake genererer Makefiles eller Ninja-filer. Man bygger i en separat mappe.<br><br>Til krydskompilering giver man en <b>toolchain-fil</b> med <code>-DCMAKE_TOOLCHAIN_FILE=...</code>. Den peger på target-compileren og sysroot.",
      code: `cmake_minimum_required(VERSION 3.16)
project(sensor CXX)
add_executable(sensor main.cpp)
find_package(Threads REQUIRED)
target_link_libraries(sensor PRIVATE Threads::Threads)` },
    { kind: "check", q: "Hvad gør `cmake -S . -B build`?",
      o: ["Genererer byggefiler i mappen build ud fra kilden her", "Kompilerer programmet og lægger det i build", "Sletter mappen build og starter forfra", "Installerer programmet i systemet"], a: 0,
      e: "-S er kildemappen og -B byggemappen. Selve kompileringen sker bagefter med cmake --build build." },
  ],

  "ai/aitools": [
    { kind: "read", title: "Forskellige værktøjer til forskellige jobs",
      body: "En <b>chat-assistent</b> (fx Claude.ai) er god til at tænke højt, skrive og forklare. En <b>coding agent</b> (fx Claude Code) arbejder direkte i dit projekt: den læser og retter filer, kører tests og laver commits. Værktøjer bygget på <b>dine egne kilder</b> (NotebookLM, et Claude-projekt) svarer ud fra dine dokumenter med henvisninger. <b>Tale-til-tekst</b> (Whisper, Wispr Flow) gør tale til tekst." },
    { kind: "read", title: "Hvordan en sprogmodel virker",
      body: "En sprogmodel genererer den mest sandsynlige fortsættelse, ord for ord. Den slår ikke op i en database. Derfor kan den lyde sikker og stadig tage fejl (<b>hallucinere</b>). Tjek vigtige fakta og kilder.<br><br><b>Context window</b> er, hvor meget tekst modellen kan se på én gang, målt i tokens. Det, der ikke er med, ved den ikke noget om i den samtale." },
    { kind: "check", q: "Du vil have resumeret 3 sider tekst så hurtigt som muligt. Hvad giver mest mening?",
      o: ["En lille, hurtig model", "Den største reasoning-model", "En coding agent", "Et tale-til-tekst-værktøj"], a: 0,
      e: "En kort og simpel opgave kræver ikke lang tænkning. En lille model er hurtigere og billigere og klarer det fint." },
    { kind: "read", title: "Store og små modeller, og MCP",
      body: "<b>Reasoning-modeller</b> tænker i flere trin, før de svarer. De er bedst til svære opgaver med mange trin, men er langsommere og dyrere. Små modeller er hurtige til simple opgaver.<br><br><b>MCP</b> (Model Context Protocol) er en åben standard, der kobler AI-apps til værktøjer og data, fx din kalender, en database eller GitHub. Det kan sammenlignes med et fælles stik, som alle værktøjer kan bruge." },
    { kind: "check", q: "Du vil have AI til at læse dine kalenderaftaler, men assistenten har ingen adgang til kalenderen. Hvad løser det?",
      o: ["En MCP-forbindelse (connector) til kalenderen", "En større context window", "En reasoning-model", "At skrive prompten mere præcist"], a: 0,
      e: "Modellen kan kun bruge data, den får adgang til. En MCP-connector giver den et værktøj til at hente kalenderen." },
  ],
});
