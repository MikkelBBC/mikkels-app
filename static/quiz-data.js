/* Spørgsmålsbank. Bygget ud fra DOA-eksamenssættene (2022-2026) og SW3SYS-eksamensemnerne.
   Format pr. spørgsmål:  { q: tekst, code?: C++-kode, o: [svarmuligheder], a: index på rigtigt svar, e: forklaring }
   `backticks` i tekst vises som kode. Svarmulighederne blandes, når de vises. */

const COURSES = [
{
  id: "doa", name: "DOA", full: "Algoritmer og datastrukturer", icon: "branch",
  units: [
  { id: "bigo", title: "Big-O og algoritmeanalyse", sub: "Tæl skridt, find worst case", questions: [
    { q: "Hvad er worst-case tidskompleksiteten?", code:
`bool hasDuplicate(const vector<int>& arr) {
  for (size_t i = 0; i < arr.size(); i++)
    for (size_t j = i + 1; j < arr.size(); j++)
      if (arr[i] == arr[j]) return true;
  return false;
}`, o: ["O(n²)", "O(n)", "O(n log n)", "O(log n)"], a: 0,
      e: "To indlejrede løkker. Worst case er når der ingen dubletter er, så alle n(n-1)/2 par sammenlignes → O(n²)." },
    { q: "Hvad er tidskompleksiteten af prefix-sum-funktionen?", code:
`vector<int> prefix(const vector<int>& a) {
  vector<int> p(a.size());
  int sum = 0;
  for (size_t i = 0; i < a.size(); i++) {
    sum += a[i];
    p[i] = sum;
  }
  return p;
}`, o: ["O(n)", "O(n²)", "O(1)", "O(n log n)"], a: 0,
      e: "Én løkke over n elementer med konstant arbejde pr. gennemløb → O(n). Eksamen 2024: \"2 + 2n + 1\" skridt → O(n)." },
    { q: "Hvor mange gange kører løkken, udtrykt i n?", code:
`for (int i = 1; i < n; i *= 2) {
  cout << i << "\\n";
}`, o: ["log₂ n gange → O(log n)", "n/2 gange, fordi i vokser → O(n)", "n gange, én pr. værdi af i → O(n)", "√n gange, fordi i ganges → O(√n)"], a: 0,
      e: "i fordobles hver gang: 1, 2, 4, 8 … Antallet af fordoblinger før i ≥ n er log₂ n." },
    { q: "Hvad er tidskompleksiteten?", code:
`for (int i = 0; i < n; i++)
  for (int j = 1; j < n; j *= 2)
    count++;`, o: ["O(n log n)", "O(n²)", "O(log n)", "O(n)"], a: 0,
      e: "Ydre løkke n gange, indre løkke log n gange (j fordobles) → n · log n." },
    { q: "T(n) = 3n² + 100n + 5. Hvad er Big-O?", o: ["O(n²)", "O(n)", "O(3n²)", "O(100n)"], a: 0,
      e: "Kun det dominerende led tæller, og konstanter droppes. For store n vinder n²." },
    { q: "Hvilken funktion vokser hurtigst for store n?", o: ["2ⁿ", "n³", "n² log n", "n log n"], a: 0,
      e: "Eksponentiel vækst (2ⁿ) slår alle polynomier som n³ og n² log n." },
    { q: "Bubble sort med early exit (stopper hvis et gennemløb ikke bytter noget). Hvad er best case, og hvilket input giver det?",
      o: ["O(n) – allerede sorteret input", "O(n²) – allerede sorteret input", "O(n log n) – tilfældigt input", "O(1) – tomt input"], a: 0,
      e: "Ved sorteret input bytter første gennemløb intet, og algoritmen stopper efter n-1 sammenligninger." },
    { q: "Samme bubble sort. Hvilket input giver worst case?", o: ["Omvendt sorteret, fx {5,4,3,2,1}", "Allerede sorteret, fx {1,2,3,4,5}", "Alle elementer ens, fx {1,1,1,1}", "Tilfældig rækkefølge, fx {3,1,4,2,5}"], a: 0,
      e: "Ved omvendt sortering skal hvert element boble hele vejen, så alle n-1 gennemløb bytter → O(n²). Typisk eksamensspørgsmål: 'beskriv worst-case input'." },
    { q: "Funktionen tæller alle dublet-par uden at stoppe tidligt. Hvor mange gange køres `if` for n = 5?", code:
`int count = 0;
for (int i = 0; i < n; i++)
  for (int j = i + 1; j < n; j++)
    if (arr[i] == arr[j]) count++;`, o: ["10", "25", "20", "5"], a: 0,
      e: "n(n-1)/2 = 5·4/2 = 10 sammenligninger." },
    { q: "Grafen viser antal skridt for tre algoritmer. Hvilken kurve er O(n log n)?", chart: {"kind": "line", "x": "n (antal elementer)", "y": "Antal skridt", "series": [{"name": "A", "pts": [[1, 1], [2, 4], [3, 9], [4, 16], [5, 25], [6, 36], [7, 49], [8, 64], [9, 81], [10, 100]]}, {"name": "B", "pts": [[1, 0.0], [2, 2.0], [3, 4.8], [4, 8.0], [5, 11.6], [6, 15.5], [7, 19.7], [8, 24.0], [9, 28.5], [10, 33.2]]}, {"name": "C", "pts": [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8], [9, 9], [10, 10]]}]}, o: ["B", "A", "C", "Ingen af dem"], a: 0,
      e: "A vokser hurtigst (n²), C er en ret linje (n), og B ligger imellem: n · log₂ n. Ved n = 8 er det 64, 24 og 8 skridt." },
  ]},
  { id: "search", title: "Søgning, pointere og iteratorer", sub: "Binær søgning, iterator-faldgruber", questions: [
    { q: "Hvad kræver binær søgning af data?", o: ["At de er sorteret", "At de ligger i en linked list", "At der ingen dubletter er", "At størrelsen er en potens af 2"], a: 0,
      e: "Binær søgning halverer intervallet ud fra sammenligning med midten – det giver kun mening i sorteret data med random access." },
    { q: "Cirka hvor mange sammenligninger bruger binær søgning højst på 1.000.000 elementer?", o: ["≈ 20", "≈ 1.000", "≈ 500.000", "≈ 100"], a: 0,
      e: "log₂(1.000.000) ≈ 20, fordi 2²⁰ ≈ 1.048.576." },
    { q: "Hvad udskrives?", code:
`int arr[] = {4, 8, 15, 16, 23};
int* p = arr;
p += 2;
cout << *p;`, o: ["15", "8", "6", "Adressen på arr[2]"], a: 0,
      e: "p peger på arr[0]; p += 2 flytter to elementer frem. *p dereferencer → arr[2] = 15." },
    { q: "Hvad kan gå galt her?", code:
`vector<int> v = {1, 2, 3};
auto it = v.begin();
v.push_back(4);
cout << *it;`, o: ["it kan være ugyldig, fordi vektoren kan reallokere", "Intet – iteratorer følger automatisk med vektoren", "Compile-fejl, fordi begin() returnerer en pointer", "Det udskriver altid 4, fordi it nu peger bagerst"], a: 0,
      e: "Hvis kapaciteten er opbrugt, flytter vector sine data til ny hukommelse. Gamle iteratorer peger så på frigivet hukommelse (undefined behavior)." },
    { q: "Hvad returnerer `std::find(v.begin(), v.end(), x)` hvis x ikke findes?", o: ["v.end()", "nullptr", "-1", "v.begin()"], a: 0,
      e: "STL-algoritmer signalerer 'ikke fundet' med end-iteratoren." },
    { q: "Hvorfor skriver man `mid = lo + (hi - lo) / 2` i stedet for `(lo + hi) / 2`?", o: ["For at undgå integer overflow når lo + hi er stort", "Det er hurtigere", "For at runde op", "Fordi (lo+hi)/2 giver forkert resultat for lige tal"], a: 0,
      e: "lo + hi kan overstige INT_MAX for store arrays. hi - lo kan ikke." },
    { q: "Worst-case for lineær søgning i et usorteret array?", o: ["O(n)", "O(log n)", "O(1)", "O(n²)"], a: 0,
      e: "Elementet kan ligge sidst eller slet ikke være der – så alle n skal tjekkes." },
  ]},
  { id: "strings", title: "Strengsøgning: KMP og Rabin-Karp", sub: "LPS/pi-tabel, søgetrin, hash", questions: [
    { q: "Hvad er LPS-tabellen (longest prefix that is also a suffix) for mønstret `abaa`?", o: ["[0, 0, 1, 1]", "[0, 0, 1, 2]", "[0, 1, 0, 1]", "[0, 0, 0, 1]"], a: 0,
      e: "a → 0, ab → 0, aba → 1 (\"a\" er både prefix og suffix), abaa → 1 (kun \"a\"; \"ab\" ≠ \"aa\"). Eksamen forår 2024." },
    { q: "Eksamen forår 2024 skriver pi-tabellen med -1 forrest. Hvordan ser den ud for `abaa`?", o: ["[-1, 0, 0, 1, 1]", "[-1, 0, 0, 1, 2]", "[-1, 0, 1, 0, 1]", "[0, 0, 1, 1, -1]"], a: 0,
      e: "Det er samme LPS-værdier [0, 0, 1, 1], bare forskudt én plads med -1 som startværdi. -1 betyder: ryk videre i teksten." },
    { q: "KMP søger efter `abaa` i `ababcabaa`. På hvilket index starter matchet?", o: ["Index 5", "Index 2", "Index 4", "Mønstret findes ikke"], a: 0,
      e: "S[5..8] = a b a a. Ved index 2 står \"abc…\", så det fejler ved c." },
    { q: "Samme søgning: `aba` matcher S[0..2], men S[3] = 'b' ≠ P[3] = 'a'. Hvad sammenligner KMP S[3] med nu?", o: ["P[1], fordi LPS[2] = 1", "P[0], man starter forfra i mønstret", "P[2], fordi tre tegn allerede passede", "S[1] med P[0], man rykker teksten tilbage"], a: 0,
      e: "Vi ved at \"a\" i slutningen af \"aba\" også er et prefix, så j sættes til LPS[2] = 1. S[3] = 'b' = P[1], og søgningen fortsætter uden at gå tilbage i teksten." },
    { q: "Hvad er LPS-tabellen for mønstret `212` (eksamen 2023)?", o: ["[0, 0, 1]", "[0, 1, 2]", "[0, 1, 0]", "[1, 0, 1]"], a: 0,
      e: "2 → 0, 21 → 0, 212 → 1 (\"2\" er både prefix og suffix). Det står også i løsningen til januar 2023." },
    { q: "Hvad er LPS-tabellen for `aabaaab`?", o: ["[0, 1, 0, 1, 2, 2, 3]", "[0, 1, 0, 1, 2, 3, 3]", "[0, 1, 0, 1, 2, 0, 1]", "[0, 1, 0, 0, 1, 2, 3]"], a: 0,
      e: "Ved index 5 fejler 'a' mod P[2] = 'b', så k falder til LPS[1] = 1, og 'a' = P[1] giver 2. Til sidst matcher 'b' P[2] → 3 (\"aab\")." },
    { q: "Hvad er worst-case tidskompleksiteten for KMP med tekstlængde n og mønsterlængde m?", o: ["O(n + m)", "O(n · m)", "O(n log m)", "O(m²)"], a: 0,
      e: "LPS-tabellen bygges i O(m), og selve søgningen går aldrig tilbage i teksten, så den er O(n)." },
    { q: "Hvorfor er den naive søgning O(n · m) i worst case, når KMP ikke er?", o: ["Den rykker tilbage i teksten efter hver fejl", "Den bruger en hashfunktion med mange kollisioner", "Den skal sortere teksten før den søger", "Den bygger en LPS-tabel for hver position"], a: 0,
      e: "Naivt starter man forfra ét tegn længere fremme og genlæser tegn. Fx `aaaab` i `aaaa…a` giver m sammenligninger pr. position." },
    { q: "Rabin-Karp med alfabet 0-9 og primtal 23. Hvad er hash-værdien af mønstret `212`?", o: ["5", "15", "9", "2"], a: 0,
      e: "212 mod 23: 23 · 9 = 207, og 212 − 207 = 5." },
    { q: "Rabin-Karp finder et vindue med samme hash som mønstret. Hvad nu?", o: ["Sammenlign tegn for tegn – det kan være et falsk match", "Mønstret er fundet, fordi ens hash betyder ens tekst", "Gå til næste primtal og beregn hashen igen", "Skift til KMP for resten af teksten"], a: 0,
      e: "Forskellige strenge kan have samme hash (spurious hit). Derfor tjekkes tegnene. Mange falske match giver worst case O(n · m)." },
  ]},
  { id: "lists", title: "Lister, stakke og køer", sub: "Linked lists og removeAll", questions: [
    { q: "Du pusher 1, 2, 3 på en stak og popper én gang. Hvad får du?", o: ["3", "1", "2", "Stakken er tom"], a: 0, e: "En stak er LIFO – sidst ind, først ud." },
    { q: "Hvilken datastruktur bruges typisk til at tjekke om parenteser `({[]})` er balancerede?", o: ["Stak", "Kø", "Hash map", "Heap"], a: 0,
      e: "Ved en åbnende parentes pushes den; ved en lukkende poppes og sammenlignes. LIFO matcher den indlejrede struktur." },
    { q: "Singly linked list med head- OG tail-pointer. Hvad koster det at tilføje i slutningen, og at fjerne det sidste element?", o: ["Tilføj O(1), fjern O(n)", "Begge O(1)", "Begge O(n)", "Tilføj O(n), fjern O(1)"], a: 0,
      e: "Tail giver direkte adgang til at tilføje. Men for at fjerne sidste skal tail flyttes til forgængeren, og den skal findes ved at gå fra head (eksamen 2026, Q1 C)." },
    { q: "Hvad løser en doubly linked list i forhold til spørgsmålet ovenfor?", o: ["Fjern sidste bliver O(1) via tail->prev", "Søgning efter en værdi bliver O(log n)", "Den bruger mindre hukommelse pr. node", "Indsættelse ved indeks i bliver O(log n)"], a: 0,
      e: "Med prev-pointer kan man gå baglæns fra tail i konstant tid. Prisen er en ekstra pointer pr. node." },
    { q: "Algoritme A (fra eksamen 2026) fjerner alle forekomster af target. Hvad er worst case?", code:
`void removeAll(int target) {
  for (int i = 0; i < size(); ) {
    Node* n = getNodeAt(i);   // går fra head: O(i)
    if (n->value == target)
      deleteNodeAt(i);        // går også fra head: O(i)
    else
      i++;
  }
}`, o: ["O(n²)", "O(n)", "O(n log n)", "O(1)"], a: 0,
      e: "For hvert indeks i går getNodeAt fra head (i skridt). Summen 0+1+…+n er n²/2 → O(n²)." },
    { q: "Algoritme B gennemløber listen med en pointer (prev/cur) og fjerner noder undervejs. Worst case?", code:
`Node* prev = nullptr; Node* cur = head;
while (cur) {
  if (cur->value == target) {
    Node* del = cur;
    cur = cur->next;
    if (prev) prev->next = cur; else head = cur;
    delete del;
  } else { prev = cur; cur = cur->next; }
}`, o: ["O(n)", "O(n²)", "O(log n)", "O(n log n)"], a: 0,
      e: "Hver node besøges præcis én gang, og sletning med kendt forgænger er O(1)." },
    { q: "Amortiseret tid for `vector::push_back`?", o: ["O(1)", "O(n)", "O(log n)", "O(n²)"], a: 0,
      e: "Kapaciteten fordobles når den er fuld. Kopieringen fordeles over mange indsættelser, så gennemsnittet er konstant." },
    { q: "En kø (queue) fjerner elementer i hvilken rækkefølge?", o: ["FIFO – først ind, først ud", "LIFO – sidst ind, først ud", "Mindste først", "Tilfældig"], a: 0, e: "Køen er som en kø i Netto: den der kom først, bliver betjent først." },
  ]},
  { id: "hash", title: "Hashing", sub: "E/O/D-tabeller og probing", questions: [
    { q: "h(c) = (c · 31) mod 7, lineær probing. Tabellen er:\nIndeks: 0 1 2 3 4 5 6\nTilstand: E O E E D O E\nHvor indsættes c = 10?", o: ["Indeks 2", "Indeks 3", "Indeks 4", "Indeks 0"], a: 0,
      e: "10 · 31 = 310. 310 mod 7 = 2. Indeks 2 er E (tom) → indsæt der. (Eksamen efterår 2024, Q3.1)" },
    { q: "Fortsat: 10 ligger nu på indeks 2. Tabellen er E O O E D O E. Hvor ender c = 5?", o: ["Indeks 3", "Indeks 1", "Indeks 2", "Indeks 4"], a: 0,
      e: "5 · 31 = 155, 155 mod 7 = 1. Indeks 1 er O → probe 2 (O) → probe 3 (E) → indsæt på 3." },
    { q: "Kan c = 13 allerede ligge i tabellen E O O O D O E? (h(13) = 4)", o: ["Måske – D stopper ikke søgningen, tjek indeks 5", "Nej – indeks 4 er D, så 13 er slettet", "Ja – 13 ligger altid på sin hjemmeplads 4", "Nej – søgning stopper ved første plads der ikke er O"], a: 0,
      e: "D (deleted) stopper IKKE en søgning. Vi fortsætter til indeks 5 (O) og sammenligner. Indeks 6 er E, så stopper vi der." },
    { q: "Hvorfor markerer man slettede pladser som D i stedet for at gøre dem E?", o: ["Så søgninger ikke stopper midt i en probe-kæde", "For at spare hukommelse, når tabellen senere rehashes", "For at gøre nye indsættelser hurtigere", "Fordi E kun må bruges når tabellen oprettes"], a: 0,
      e: "Hvis en plads midt i en kæde blev E, ville søgning efter elementer længere fremme stoppe og fejlagtigt sige 'ikke fundet'. Det kaldes lazy deletion." },
    { q: "Strenghash (djb2): h = 5381; for hvert tegn: h = h·33 + tegn. Tabelstørrelse 7. Hvad er h(\"go\") mod 7? ('g' = 103, 'o' = 111)", o: ["2", "4", "1", "5"], a: 0,
      e: "h('g') = 5381·33 + 103 = 177676. h('go') = 177676·33 + 111 = 5863419. 5863419 mod 7 = 2. (Reeksamen sommer 2024)" },
    { q: "Hvad er load factor λ, og hvad gør man typisk ved lineær probing når λ bliver for høj?", o: ["λ = n / tabelstørrelse; rehash til ca. dobbelt primtal ved λ > 0,5", "λ = antal kollisioner; slet de ældste elementer når λ > 0,5", "λ = tabelstørrelse / n; halver tabellens størrelse når λ bliver for høj", "λ = gennemsnitlig probe-længde; skift hashfunktion ved λ > 2"], a: 0,
      e: "Ved lineær probing stiger probe-længden kraftigt når tabellen nærmer sig fuld, så man holder λ under ca. 0,5." },
    { q: "Hvilket problem er typisk for lineær probing?", o: ["Primary clustering – optagede pladser klumper sammen", "Elementer kan slet ikke slettes fra tabellen", "Tabellen kan kun indeholde heltal som nøgler", "Søgning bliver altid O(n), også selvom tabellen er helt tom"], a: 0,
      e: "Kollisioner hober sig op i sammenhængende blokke. Kvadratisk probing eller dobbelt hashing spreder dem bedre." },
    { q: "Separate chaining: hvad er worst case for opslag?", o: ["O(n) – alle nøgler havner i samme kæde", "O(1) – kæderne holdes altid korte", "O(log n) – kæderne er sorterede", "O(n²) – hver kæde gennemløbes for hver nøgle"], a: 0,
      e: "Gennemsnittet er O(1) med en god hashfunktion, men værst tænkelige tilfælde er én lang liste." },
    { q: "Hvorfor vælger man ofte et primtal som tabelstørrelse?", o: ["Det spreder nøgler bedre, når de har et mønster", "Det gør tabellen mindre og sparer hukommelse", "Det er et krav i std::unordered_map", "Det forhindrer alle kollisioner fuldstændigt i tabellen"], a: 0,
      e: "Med fx størrelse 10 havner alle nøgler der ender på 0 samme sted. Et primtal har ingen fælles faktorer med typiske mønstre." },
  ]},
  { id: "rec", title: "Rekursion", sub: "Basistilfælde og træ-rekursion", questions: [
    { q: "Hvad mangler i funktionen?", code:
`int fact(int n) {
  return n * fact(n - 1);
}`, o: ["Et basistilfælde, fx if (n <= 1) return 1;", "En for-løkke der tæller n ned til 1", "Et ekstra return-statement til sidst i funktionen", "Intet – den returnerer n! korrekt"], a: 0,
      e: "Uden basistilfælde kalder den sig selv uendeligt, indtil stakken løber over (stack overflow)." },
    { q: "Hvad returnerer f(16)?", code:
`int f(int n) {
  if (n <= 1) return 1;
  return f(n / 2) + 1;
}`, o: ["5", "4", "16", "8"], a: 0,
      e: "f(16) = f(8)+1 = f(4)+2 = f(2)+3 = f(1)+4 = 1+4 = 5." },
    { q: "En 'lonely child' er en node hvis forælder har præcis ét barn (eksamen efterår 2024). Hvilken linje tæller korrekt for noden root?", code:
`int countLonely(Node* root) {
  if (root == nullptr) return 0;
  int lonely = 0;
  // ???
  return lonely + countLonely(root->left)
                + countLonely(root->right);
}`, o: ["if ((root->left == nullptr) != (root->right == nullptr)) lonely = 1;", "if (root->left != nullptr && root->right != nullptr) lonely = 1;", "if (root->left == nullptr && root->right == nullptr) lonely = 1;", "if (root->left != nullptr || root->right != nullptr) lonely = 1;"], a: 0,
      e: "Præcis ét barn = det ene er nullptr og det andet ikke (XOR). Så har root ét 'lonely child'." },
    { q: "Hvad er tidskompleksiteten af countLonely på et træ med n noder?", o: ["O(n)", "O(log n)", "O(n²)", "O(2ⁿ)"], a: 0, e: "Hver node besøges præcis én gang med konstant arbejde." },
    { q: "Naiv rekursiv Fibonacci `fib(n) = fib(n-1) + fib(n-2)`. Kompleksitet?", o: ["Eksponentiel, ca. O(2ⁿ)", "Lineær, O(n) – ét kald pr. n", "Kvadratisk, O(n²)", "Logaritmisk, O(log n)"], a: 0,
      e: "Hvert kald forgrener sig i to, og de samme værdier regnes om og om igen. Med memoization bliver det O(n)." },
    { q: "Højde målt i kanter: hvad skal height(nullptr) returnere, så et blad får højde 0?", code:
`int height(Node* t) {
  if (t == nullptr) return ???;
  return 1 + max(height(t->left), height(t->right));
}`, o: ["-1", "0", "1", "INT_MAX"], a: 0, e: "Et blad: 1 + max(-1, -1) = 0. Eksamen 2026 definerer højde som antal kanter på længste sti." },
    { q: "Hvad er halerekursion (tail recursion)?", o: ["Det rekursive kald er det sidste funktionen gør", "Rekursion der starter fra halen af en liste", "Rekursion hvor funktionen kalder sig selv to gange", "Rekursion hvor basistilfældet står til sidst"], a: 0,
      e: "Når intet arbejde venter efter kaldet, kan compileren genbruge stack-frame og omdanne det til en løkke." },
  ]},
  { id: "sort", title: "Sortering", sub: "Bubble, merge, quick, insertion", questions: [
    { q: "Bubble sort på {3, 1, 4, 1, 5, 9, 2}. Hvordan ser arrayet ud efter FØRSTE gennemløb?", o: ["{1, 3, 1, 4, 5, 2, 9}", "{1, 1, 2, 3, 4, 5, 9}", "{1, 3, 4, 1, 5, 2, 9}", "{3, 1, 4, 1, 5, 2, 9}"], a: 0,
      e: "Byt 3↔1, 4↔1, 9↔2. Største element (9) er boblet helt til sidst. (Eksamen efterår 2024, Q4.1)" },
    { q: "Efter k gennemløb af bubble sort – hvad ved man med sikkerhed?", o: ["De sidste k elementer står på endelig plads", "De første k elementer er sorteret indbyrdes", "Arrayet er sorteret op til midten", "Det mindste element står forrest"], a: 0,
      e: "Hvert gennemløb placerer det største resterende element bagerst." },
    { q: "Quicksort med første element som pivot. Hvad sker der med allerede sorteret input?", o: ["Worst case O(n²) – partitionerne bliver skæve", "Best case O(n) – den opdager at det er sorteret", "O(n log n) – pivotvalget betyder ikke noget", "Uendelig løkke – partitionen bliver aldrig mindre"], a: 0,
      e: "Pivot er altid mindst, så den ene del har n-1 elementer. Løsning: median-of-three eller tilfældig pivot." },
    { q: "Hvad er sandt om merge sort?", o: ["Altid O(n log n), men O(n) ekstra plads", "O(n²) i worst case ved sorteret input", "In-place – bruger ingen ekstra hukommelse", "Ikke stabil – lige elementer kan bytte plads"], a: 0, e: "Merge-skridtet kræver et hjælpe-array. Til gengæld er den stabil og forudsigelig." },
    { q: "Hvilken sortering er bedst til et NÆSTEN sorteret array?", o: ["Insertion sort – næsten O(n)", "Selection sort – færrest byt", "Heapsort – altid O(n log n)", "Quicksort med første element som pivot"], a: 0,
      e: "Insertion sort flytter kun elementer der står forkert, så næsten sorteret input går næsten lineært." },
    { q: "Hvad er den nedre grænse for sammenligningsbaseret sortering?", o: ["Ω(n log n)", "Ω(n)", "Ω(n²)", "Ω(log n)"], a: 0,
      e: "Der er n! mulige rækkefølger, og et beslutningstræ skal have dybde ≥ log₂(n!) ≈ n log n." },
    { q: "Hvad betyder det at en sortering er stabil?", o: ["Lige store elementer beholder deres rækkefølge", "Den har samme køretid uanset input", "Den bruger ingen ekstra hukommelse", "Den giver præcis samme resultat ved hver eneste kørsel"], a: 0,
      e: "Vigtigt når man sorterer på flere nøgler, fx først efter navn og så efter alder." },
  ]},
  { id: "heap", title: "Heaps og prioritetskøer", sub: "Array-repræsentation, percolate", questions: [
    { q: "Binær heap gemt i array (0-indekseret). Hvor er børnene til indeks i?", o: ["2i + 1 og 2i + 2", "2i og 2i + 1", "i + 1 og i + 2", "i/2 og i/2 + 1"], a: 0,
      e: "Med 0-indeks: venstre 2i+1, højre 2i+2, forælder (i-1)/2. (Med 1-indeks: 2i, 2i+1, i/2.)" },
    { q: "Indsæt 5, 3, 8, 1 i en tom min-heap. Hvordan ser arrayet ud?", o: ["[1, 3, 8, 5]", "[1, 3, 5, 8]", "[5, 3, 8, 1]", "[1, 5, 8, 3]"], a: 0,
      e: "[5] → [3,5] → [3,5,8] → 1 indsættes på indeks 3, percolate up: bytter med 5, så med 3 → [1,3,8,5]." },
    { q: "Min-heapen er [1, 2, 9, 7, 4]. Hvordan ser den ud efter deleteMin?", o: ["[2, 4, 9, 7]", "[2, 9, 7, 4]", "[4, 2, 9, 7]", "[2, 7, 9, 4]"], a: 0,
      e: "Sidste element (4) flyttes til roden: [4,2,9,7]. Percolate down: byt med mindste barn 2 → [2,4,9,7]. 4's barn 7 er større, så stop." },
    { q: "Hvilket array er IKKE en gyldig min-heap?", o: ["[1, 5, 2, 3, 6, 7]", "[1, 3, 2, 6, 4, 5]", "[1, 2, 3, 4, 5, 6]", "[2, 4, 3, 7, 5, 9]"], a: 0,
      e: "I [1,5,2,3,6,7] har indeks 1 (værdi 5) barnet på indeks 3 med værdi 3 < 5. Det bryder heap-egenskaben." },
    { q: "Kompleksitet for findMin og deleteMin i en binær min-heap?", o: ["findMin O(1), deleteMin O(log n)", "Begge O(log n)", "Begge O(1)", "findMin O(log n), deleteMin O(n)"], a: 0,
      e: "Minimum er altid roden. Sletning kræver percolate down gennem træets højde." },
    { q: "Hvad koster buildHeap (bottom-up heapify) af n elementer?", o: ["O(n)", "O(n log n)", "O(log n)", "O(n²)"], a: 0,
      e: "De fleste noder er tæt på bunden og skal kun flyttes kort. Summen giver lineær tid – bedre end n indsættelser." },
    { q: "Eksamen 2024: Søgemaskine med emne → sider rangeret efter in-degree. Hvilken struktur giver O(1) opslag af emne og O(1) adgang til bedste side?", o: ["Hash map fra emne til max-heap af sider", "Sorteret array af (emne, side)-par", "BST af emner med en linked list af sider", "Max-heap af alle sider på tværs af emner"], a: 0,
      e: "Hash map giver O(1) opslag; max-heapens rod er siden med højest rang (peek O(1))." },
  ]},
  { id: "bst", title: "Binære søgetræer", sub: "Indsæt, slet, højde", questions: [
    { q: "Indsæt [42, 15, 68, 8, 30, 20, 25] i et tomt BST. Hvad er højden (antal kanter på længste sti)?", o: ["4", "3", "6", "2"], a: 0,
      e: "Længste sti: 42 → 15 → 30 → 20 → 25 = 4 kanter. (Eksamen forår 2026, Q2)" },
    { q: "Hvad er den absolut værste højde for et BST med 7 noder?", o: ["6", "3", "7", "2"], a: 0, e: "Hvis træet degenererer til en kæde (fx sorteret indsættelse), er der n-1 = 6 kanter." },
    { q: "Hvilken indsættelsesrækkefølge giver en kæde?", o: ["1, 2, 3, 4, 5", "3, 1, 4, 2, 5", "3, 2, 4, 1, 5", "4, 2, 6, 1, 3"], a: 0, e: "Sorteret input: hvert nyt element bliver højre barn af det forrige." },
    { q: "Hvordan sletter man en node med TO børn?", o: ["Erstat med in-order successor og slet den", "Slet noden og hele dens undertræ", "Løft venstre barn op og drop højre undertræ", "Byt noden med roden og slet den derfra"], a: 0,
      e: "Successoren har højst ét barn (intet venstre), så den er nem at fjerne bagefter. Predecessor (største i venstre) virker også." },
    { q: "I træet fra [42, 15, 68, 8, 30, 20, 25]: slet 15 med in-order successor. Hvad kommer til at stå hvor 15 stod?", o: ["20", "30", "8", "25"], a: 0,
      e: "15 har to børn. Mindste i højre undertræ (30 → 20) er 20. 20 flyttes op, og 20's højre barn 25 tager 20's gamle plads under 30." },
    { q: "Hvad giver en in-order gennemgang af et BST?", o: ["Værdierne i sorteret rækkefølge", "Roden først, derefter bladene", "Knuderne niveau for niveau", "Værdierne i omvendt sorteret orden"], a: 0, e: "Venstre → node → højre besøger mindste til største." },
    { q: "Pre-order af træet fra [42, 15, 68, 8, 30, 20, 25]?", o: ["42 15 8 30 20 25 68", "8 15 20 25 30 42 68", "8 25 20 30 15 68 42", "42 15 68 8 30 20 25"], a: 0,
      e: "Node → venstre → højre. 42, så venstre undertræ (15, 8, 30, 20, 25), så 68." },
    { q: "Eksamen 2024: søgefunktionen bruger en while-løkke uden rekursive kald. Hvad er den, og hvad er worst case?", o: ["Iterativ; O(n) for et kædeformet træ", "Rekursiv; O(log n) fordi den halverer", "Iterativ; O(log n) i alle tilfælde", "Rekursiv; O(n) fordi den kalder sig selv"], a: 0,
      e: "Ingen selvkald → iterativ. Et almindeligt BST er ikke balanceret, så worst case er en kæde." },
  ]},
  { id: "avl", title: "AVL-træer", sub: "Balance og rotationer", questions: [
    { q: "Hvad er AVL-betingelsen?", o: ["Højde(venstre) og højde(højre) afviger højst 1 i hver node", "Træet skal være komplet – alle niveauer helt fyldt op fra venstre", "Alle blade skal ligge på præcis samme niveau", "Roden skal altid være medianen af værdierne"], a: 0, e: "Det garanterer højde O(log n)." },
    { q: "Træet: 17 med børn 10 og 33; 10 har børn 8 og 12. Indsæt 14. Hvilken rotation skal til?", o: ["Dobbeltrotation (venstre-højre) ved 17", "Enkelt højrerotation ved 17", "Enkelt venstrerotation ved 10", "Ingen – træet er stadig AVL-balanceret efter indsættelsen"], a: 0,
      e: "14 lander som højre barn af 12. Ubalancen er ved 17 og ligger i venstre barns HØJRE undertræ → inner case → dobbeltrotation. 12 bliver ny rod. (Reeksamen 2024)" },
    { q: "Hvad bliver roden efter dobbeltrotationen ovenfor?", o: ["12", "10", "14", "17"], a: 0, e: "Efter første rotation er 12 over 10; efter anden rotation er 12 roden med 10 til venstre og 17 til højre." },
    { q: "Indsæt 1, 2, 3 i et tomt AVL-træ. Hvad sker der?", o: ["Enkelt venstrerotation, 2 bliver rod", "Dobbeltrotation, 3 bliver rod", "Ingen rotation", "Enkelt højrerotation, hvorefter 1 bliver rod"], a: 0, e: "Højre-højre (outer) ubalance ved 1 → én venstrerotation." },
    { q: "Indsæt 3, 1, 2 i et tomt AVL-træ. Hvad skal der til?", o: ["Dobbeltrotation (venstre-højre), 2 bliver rod", "Enkelt højrerotation, hvorefter 1 bliver rod", "Ingen rotation", "Enkelt venstrerotation, hvorefter 3 forbliver rod"], a: 0, e: "2 ligger i venstre barns højre side → inner case → dobbelt." },
    { q: "Hvornår er én enkelt rotation nok?", o: ["Ved outer imbalance (V-V eller H-H)", "Ved inner imbalance (V-H eller H-V)", "Ved alle ubalancer – AVL bruger kun én", "Aldrig – AVL bruger altid to rotationer"], a: 0, e: "Inner (venstre-højre eller højre-venstre) kræver dobbeltrotation." },
    { q: "Hvad er worst case for søgning i et AVL-træ?", o: ["O(log n)", "O(n)", "O(1)", "O(n log n)"], a: 0, e: "Balancen holder højden logaritmisk – i modsætning til et almindeligt BST." },
  ]},
  { id: "graph", title: "Grafer, BFS og DFS", sub: "Repræsentation og gennemløb", questions: [
    { q: "Pladsforbrug for adjacency matrix og adjacency list?", o: ["Matrix O(V²), liste O(V + E)", "Begge O(V + E)", "Matrix O(E), liste O(V²)", "Begge O(V²)"], a: 0, e: "Matrixen har en celle for hvert par af knuder uanset antal kanter." },
    { q: "Eksamen 2024: 10 websider med 18 links. Hvilken repræsentation, og hvorfor?", o: ["Liste – grafen er sparsom (18 af 100 mulige)", "Matrix – fordi grafen er rettet", "Matrix – den er altid hurtigst at gennemløbe", "Liste – fordi grafen indeholder cykler"], a: 0,
      e: "Sparsom graf → liste sparer plads og gennemløb af naboer er hurtigt. Matrix er god ved tætte grafer eller hyppige 'findes kanten?'-opslag (O(1))." },
    { q: "Hvilken datastruktur driver BFS og DFS?", o: ["BFS: kø – DFS: stak (eller rekursion)", "BFS: stak – DFS: kø", "Begge bruger en prioritetskø", "BFS: min-heap – DFS: hash map"], a: 0, e: "Køen giver niveau-for-niveau; stakken går i dybden først." },
    { q: "Graf: A→B, A→C, B→D, C→D, C→E, D→F. Naboer i alfabetisk orden. BFS fra A?", o: ["A B C D E F", "A B D F C E", "A C E D B F", "A B C E D F"], a: 0, e: "Niveau 0: A. Niveau 1: B, C. Niveau 2: D (via B), E (via C). Niveau 3: F." },
    { q: "Samme graf. Rekursiv DFS fra A?", o: ["A B D F C E", "A B C D E F", "A C E D F B", "A B D C E F"], a: 0, e: "A → B → D → F (bund), tilbage til A → C → (D allerede besøgt) → E." },
    { q: "Hvad finder BFS i en uvægtet graf?", o: ["Korteste vej målt i antal kanter", "Billigste vej når kanterne har vægte", "Et minimum spanning tree fra start", "Alle cykler der går gennem startknuden"], a: 0, e: "Første gang BFS når en knude, er det via færrest mulige kanter." },
    { q: "En web-crawler følger links. Hvorfor skal den have et 'visited'-sæt?", o: ["Grafen har cykler – ellers kører den i ring", "For at kunne sortere siderne efter rang", "For at kunne beregne in-degree for hver side bagefter", "Det er kun nødvendigt hvis man bruger DFS"], a: 0, e: "Side A linker til B, B linker tilbage til A …" },
    { q: "Hvad er in-degree for en knude?", o: ["Antal kanter der peger IND på knuden", "Antal udgående kanter", "Afstanden fra startknuden", "Antal naboer i alt i en uorienteret graf"], a: 0, e: "Eksamen 2024 brugte in-degree som simpel 'PageRank': flere sider linker til dig → højere rang." },
    { q: "Kompleksitet af BFS med adjacency list?", o: ["O(V + E)", "O(V²)", "O(E log V)", "O(V · E)"], a: 0, e: "Hver knude sættes i kø én gang, og hver kant kigges på én gang." },
  ]},
  { id: "dijkstra", title: "Dijkstra og A*", sub: "Korteste veje og robotter", questions: [
    { q: "Hvad kræver Dijkstra af kantvægtene?", o: ["De må ikke være negative", "De skal være heltal", "De skal være forskellige", "De skal være 1"], a: 0, e: "Dijkstra antager at en færdig knude aldrig kan blive billigere senere – negative kanter bryder det." },
    { q: "Graf (uorienteret): A–B 4, A–C 1, C–B 2, B–D 1, C–D 5. Korteste afstand fra A til D?", o: ["4", "5", "6", "3"], a: 0, e: "A→C (1) → B (1+2=3) → D (3+1=4). Den direkte C→D giver 6." },
    { q: "Samme graf. I hvilken rækkefølge bliver knuderne 'færdige' (taget ud af prioritetskøen)?", o: ["A, C, B, D", "A, B, C, D", "A, C, D, B", "A, B, D, C"], a: 0, e: "A(0), så C(1), så B(3 – via C), så D(4)." },
    { q: "Hvad er f(n) i A*?", o: ["f = g + h: pris hertil + estimeret rest", "f = h: kun estimeret afstand til målet", "f = g · h: prisen hertil ganget med estimatet", "f = antal kanter fra start til n"], a: 0, e: "g er den faktiske pris fra start, h er heuristikken mod målet." },
    { q: "Hvornår garanterer A* den korteste vej?", o: ["Når h er admissible – aldrig overvurderer", "Altid – A* finder altid korteste vej", "Når h(n) er så stor som overhovedet muligt", "Kun i grafer hvor alle kanter vejer 1"], a: 0, e: "Overvurderer h, kan A* overse den rigtige vej." },
    { q: "Robotter kører på et kort (eksamen 2026). Hvilken heuristik er naturlig til A*?", o: ["Luftlinje (euklidisk afstand) til målet", "Antal kanter robotten har kørt indtil nu", "Summen af alle kantvægte i grafen", "Største enkelte kantvægt i grafen"], a: 0, e: "Luftlinjen er aldrig længere end den faktiske vej → admissible." },
    { q: "Hvad sker der med A* hvis h(n) = 0 for alle knuder?", o: ["Den opfører sig præcis som Dijkstra", "Den opfører sig præcis som BFS", "Den finder ikke længere nogen vej", "Den bliver grådig og finder ikke længere den optimale vej"], a: 0, e: "f = g, så prioritering sker kun på kendt pris – det er Dijkstra." },
    { q: "Hvorfor er BFS forkert til vejnettet med afstande som vægte?", o: ["BFS ignorerer vægte og finder færrest kanter", "BFS kan slet ikke håndtere grafer der indeholder cykler", "BFS virker kun på træer, ikke vejnet", "BFS kræver at grafen er uorienteret"], a: 0, e: "To lange kanter kan være meget længere end fem korte." },
    { q: "Robotten skal levere til flere mål uden at vende hjem (eksamen 2026, høj sværhed). Hvad er en rimelig løsning med Dijkstra?", o: ["Dijkstra fra nuværende sted, kør til nærmeste mål, gentag", "Kør BFS én gang fra start og besøg målene i BFS-orden", "Byg et MST med Prim og følg det gennem alle mål", "Kør Dijkstra én gang fra start og tag målene efter afstand"], a: 0, e: "Den optimale rækkefølge er et TSP-agtigt problem. Greedy 'nærmeste næste' er simpel og god nok i praksis." },
    { q: "Kompleksitet af Dijkstra med binær heap og adjacency list?", o: ["O((V + E) log V)", "O(V²) uanset datastruktur", "O(V + E) som BFS", "O(E · V) som Bellman-Ford"], a: 0, e: "Hver kant kan give en decreaseKey/indsættelse i heapen til log V." },
  ]},
  { id: "mst", title: "MST: Prim og Kruskal", sub: "Spændetræer og modifikation", questions: [
    { q: "Hvor mange kanter har et minimum spanning tree for en sammenhængende graf med V knuder?", o: ["V − 1", "V", "E − 1", "V²"], a: 0, e: "Et træ med V knuder har altid V − 1 kanter." },
    { q: "Hvad er forskellen på Prim og Kruskal?", o: ["Prim vokser ét træ; Kruskal sorterer kanter + union-find", "Prim virker kun på rettede grafer, Kruskal på uorienterede", "Kruskal finder korteste veje, Prim finder spændetræer", "Ingen – de er to navne for samme algoritme"], a: 0, e: "Begge er grådige og giver et MST." },
    { q: "Graf: A–B 2, A–C 3, B–C 1, B–D 4, C–D 5, D–E 1. Prim fra A – rækkefølge knuderne tilføjes?", o: ["A, B, C, D, E", "A, C, B, D, E", "A, B, D, E, C", "A, B, C, E, D"], a: 0, e: "A → B (2) → C via B–C (1) → D via B–D (4) → E via D–E (1)." },
    { q: "Samme graf. Hvad er MST'ets samlede vægt?", o: ["8", "7", "9", "11"], a: 0, e: "Kanterne i MST'et er A–B (2), B–C (1), B–D (4) og D–E (1): 2 + 1 + 4 + 1 = 8." },
    { q: "Hvornår afviser Kruskal en kant?", o: ["Når endepunkterne er i samme komponent (cykel)", "Når vægten er højere end gennemsnittet af de valgte kanter", "Når kanten forbinder to blade i træet", "Når en knude allerede har to kanter"], a: 0, e: "Union-find: find(u) == find(v) → samme sæt → cykel." },
    { q: "Eksamen 2026: grad-k-begrænset MST (ingen knude må have mere end k kanter). Simpel modifikation af Prim?", o: ["Spring kanter over til knuder med grad k (ikke optimalt)", "Kør almindelig Prim k gange og vælg det bedste træ", "Brug Dijkstra i stedet, da den respekterer grader", "Sorter knuderne efter grad og kør Prim fra den med højest grad"], a: 0, e: "Hold en grad-tæller pr. knude. Grådigt valg er ikke længere garanteret optimalt (problemet er NP-hårdt), men opgaven krævede ikke optimalitet." },
    { q: "Hvornår er MST'et entydigt?", o: ["Når alle kantvægte er forskellige", "Altid – et MST er altid entydigt", "Når grafen er komplet (alle par forbundet)", "Når antallet af knuder er lige"], a: 0, e: "Med ens vægte kan flere lige billige træer eksistere." },
  ]},
  ]
},
{
  id: "sys", name: "SYS", full: "Systemprogrammering (SW3SYS)", icon: "terminal",
  units: [
  { id: "basis", title: "Basis: OS og computing", sub: "Forudsætning for alle emner", questions: [
    { q: "Hvad sker der når et program laver et system call som `read()`?", o: ["CPU'en skifter fra user mode til kernel mode", "Programmet genstartes i en ny proces", "Kernen kopieres midlertidigt ind i user space", "Intet mode-skift – read kører i user space"], a: 0, e: "Dual-mode: privilegerede operationer må kun køres i kernel mode. System call er den kontrollerede vej derind (trap)." },
    { q: "`chmod 754 script.sh` – hvad betyder det?", o: ["Ejer rwx, gruppe r-x, andre r--", "Ejer r--, gruppe r-x, andre rwx", "Alle rwx", "Ejer rw-, gruppe r--, andre r--"], a: 0, e: "7 = 4+2+1 = rwx, 5 = 4+1 = r-x, 4 = r--." },
    { q: "Hvad betyder `#!/bin/bash` øverst i et script?", o: ["Shebang – vælger fortolkeren til scriptet", "En kommentar som bash ignorerer helt", "At scriptet skal køres som root", "At scriptet kun kan køres fra /bin"], a: 0, e: "Kerne læser shebang ved exec og starter /bin/bash med scriptet som argument." },
    { q: "Hvilket UID har root?", o: ["0", "1", "1000", "65535"], a: 0, e: "UID 0 har alle rettigheder. Almindelige brugere starter typisk ved 1000." },
    { q: "Hvad er en sysroot?", o: ["Mappe med target-systemets headers og libs til krydskompilering", "Root-brugerens hjemmemappe, /root, som ligger på target-systemet", "Den første partition på SD-kortet med bootloaderen", "Mappen med Linux-kernens kildekode på din PC"], a: 0, e: "Når du bygger til Raspberry Pi på din PC, skal compileren linke mod Pi'ens biblioteker – de ligger i sysroot." },
    { q: "Hvilken instruktion må KUN køres i kernel mode?", o: ["Ændre page tables / slå interrupts fra", "Lægge to registre sammen", "Kalde en funktion i samme program", "Læse en lokal variabel fra stacken"], a: 0, e: "Privilegerede instruktioner beskytter systemet mod fejlbehæftede eller ondsindede programmer." },
  ]},
  { id: "proc", title: "Process control og IPC", sub: "fork, waitpid, tilstande", questions: [
    { q: "Hvor mange gange udskrives \"hej\"?", code:
`int main() {
  fork();
  fork();
  printf("hej\\n");
}`, o: ["4", "2", "3", "8"], a: 0, e: "Hver fork fordobler antallet af processer: 1 → 2 → 4. Alle fire når printf." },
    { q: "Hvad returnerer `fork()`?", o: ["0 i barnet, barnets PID i forælderen, -1 ved fejl", "Barnets PID i begge processer", "0 i forælderen, forælderens PID i barnet", "1 i barnet, 0 i forælderen og -1 i begge processer ved fejl"], a: 0, e: "Sådan skelner man i koden: if (pid == 0) { barn } else { forælder }." },
    { q: "Hvad er en zombie-proces?", o: ["Et afsluttet barn som forælderen ikke har waitet på", "En proces hvis forælder allerede er død, så den adopteres af init", "En proces der hænger og bruger 100 % CPU", "En proces der sidder fast i kernel mode"], a: 0, e: "Process-entry'en bliver i tabellen så forælderen kan læse exit-status. waitpid rydder op." },
    { q: "Hvad sker der med et barn hvis forælderen dør først?", o: ["Det adopteres af init/systemd (PID 1)", "Det bliver dræbt sammen med forælderen", "Det bliver en zombie indtil reboot", "Det får automatisk PID 0 (swapper)"], a: 0, e: "En orphan får ny forælder, som kalder wait for den." },
    { q: "En kørende proces laver et blokerende I/O-kald. Hvilken tilstand går den til?", o: ["Waiting (blocked)", "Ready (klar til CPU)", "Terminated (afsluttet)", "New (oprettes)"], a: 0, e: "Når I/O er færdig, flyttes den til Ready og venter på CPU'en igen." },
    { q: "Hvad gør `execvp()`?", o: ["Erstatter programmet – samme PID", "Laver en ny proces med sit eget nye PID", "Venter på at et barn afslutter", "Sender et signal til en proces"], a: 0, e: "fork + exec er det klassiske mønster for at starte et andet program (sådan virker shellen)." },
    { q: "To hovedmodeller for IPC?", o: ["Shared memory og message passing", "Mutex og semafor", "TCP og UDP sockets", "Heap og stack"], a: 0, e: "Pipes, message queues og sockets er message passing. Shared memory er hurtigere men kræver synkronisering." },
  ]},
  { id: "lambda", title: "Higher-order functions og lambdas", sub: "Capture, closures, std::function", questions: [
    { q: "Hvad udskrives?", code:
`int x = 5;
auto f = [x]() mutable { x++; return x; };
f();
f();
std::cout << x;`, o: ["5", "7", "6", "Compile-fejl"], a: 0, e: "[x] fanger en KOPI. mutable lader lambdaen ændre sin egen kopi, men den ydre x er uændret." },
    { q: "Samme kode, men med `[&x]` og uden mutable. Hvad udskrives?", o: ["7", "5", "6", "Compile-fejl"], a: 0, e: "Fanget by reference: hver kald ændrer den rigtige x. 5 → 6 → 7." },
    { q: "Hvad er faren ved `[&]` i en lambda der gemmes og kaldes senere?", o: ["Dangling references når variablerne er ude af scope", "Lambdaen bliver markant langsommere end en almindelig funktion", "Lambdaen kan så ikke længere kopieres", "Variablerne kopieres to gange unødigt"], a: 0, e: "Typisk fejl når lambdaen gives til en tråd eller gemmes i en kø." },
    { q: "Hvad er en closure?", o: ["Lambda-objektet plus de fangede variabler", "En funktion der ikke tager parametre", "En klasse hvor alle medlemmer er private", "En tråd der allerede er afsluttet med join()"], a: 0, e: "Compileren laver en anonym klasse med de fangede værdier som medlemmer og operator()." },
    { q: "Hvilken lambda sorterer faldende med `std::sort(v.begin(), v.end(), ???)`?", o: ["[](int a, int b) { return a > b; }", "[](int a, int b) { return a < b; }", "[](int a) { return -a; }", "[](int a, int b) { return a - b; }"], a: 0, e: "Comparatoren returnerer true hvis a skal stå før b." },
    { q: "Hvad er en higher-order function?", o: ["En funktion der tager eller returnerer en funktion", "En funktion med mere end tre parametre", "En funktion der kalder sig selv rekursivt indtil et basistilfælde", "En virtuel funktion i en basisklasse"], a: 0, e: "std::transform, std::sort og std::for_each er eksempler." },
    { q: "Hvilken type kan gemme og kalde både en lambda, en funktionspointer og et funktionsobjekt med signatur int(int), uden cast?", o: ["std::function<int(int)>", "int (*)(int)", "auto&", "std::thread"], a: 0, e: "std::function er en type-eraser, der kan kaldes direkte som int(int). std::any kunne også gemme dem, men kræver any_cast til den præcise type før kald. En rå funktionspointer kan ikke holde lambdaer med capture." },
  ]},
  { id: "threads", title: "Threads og concurrency", sub: "Amdahl, scheduling, std::thread", questions: [
    { q: "Amdahl's lov: 75 % af programmet kan paralleliseres. Maksimal speedup på 4 kerner?", o: ["≈ 2,29", "4 – én pr. kerne", "3 – 75 % af 4", "≈ 1,33"], a: 0, e: "1 / (0,25 + 0,75/4) = 1 / 0,4375 ≈ 2,29. Den serielle del begrænser." },
    { q: "Hvad deler tråde i samme proces?", o: ["Heap, globale variabler og filer – egen stack", "Alt, også stack og registre", "Intet – hver tråd har sin egen kopi", "Kun stacken – heapen er privat"], a: 0, e: "Derfor er delt data et race-problem, mens lokale variabler er trådsikre." },
    { q: "Hvad sker der hvis et `std::thread`-objekt destrueres uden join() eller detach()?", o: ["std::terminate() kaldes – programmet crasher", "Tråden joines automatisk i destruktoren", "Tråden detaches automatisk og kører videre i baggrunden", "Tråden stoppes stille uden fejl"], a: 0, e: "Derfor findes std::jthread i C++20, som joiner i destruktoren." },
    { q: "Hvilken threading-model bruger Linux?", o: ["One-to-one: én kernel-tråd pr. tråd", "Many-to-one: alle på én kernel-tråd", "Many-to-many: puljet over få kernel-tråde", "Ingen – tråde planlægges i user space"], a: 0, e: "Det giver ægte parallelitet på flere kerner." },
    { q: "Hvilken scheduling-algoritme minimerer gennemsnitlig ventetid (hvis burst-tider kendes)?", o: ["Shortest Job First (SJF)", "First Come First Served", "Round Robin", "Priority uden aging"], a: 0, e: "SJF er beviseligt optimal for gennemsnitlig ventetid, men kræver at man kender/estimerer burst." },
    { q: "Hvad er 'convoy effect'?", o: ["Korte jobs venter bag ét langt job i FCFS", "Tråde der deadlocker", "For mange context switches i Round Robin med et lille quantum", "Når alle kerner er optaget"], a: 0, e: "Klassisk ulempe ved FCFS." },
    { q: "Linux nice-værdier: hvad giver højest prioritet?", o: ["-20", "19", "0", "+20"], a: 0, e: "Lavere nice = 'mindre flink' = mere CPU. Real-time (SCHED_FIFO/RR) bruger separat prioritet 1-99." },
    { q: "Hvad er `thread_local`?", o: ["En variabel hvor hver tråd har sin egen kopi", "En variabel der kun må læses af én tråd", "En lokal variabel i main", "En mutex"], a: 0, e: "Nyttigt til fx tråd-specifikke buffere uden låsning." },
  ]},
  { id: "sync", title: "Synchronization tools", sub: "Mutex, semaforer, condition variables", questions: [
    { q: "To tråde kører hver `counter++` 1.000.000 gange. Hvorfor er resultatet ofte under 2.000.000?", o: ["counter++ er read-modify-write, ikke atomar", "CPU'en springer instruktioner over under last", "Compileren fjerner løkken som død kode", "int løber over før 2.000.000"], a: 0, e: "Race condition. Løsning: std::mutex eller std::atomic<int>." },
    { q: "Hvilke tre krav skal en løsning på critical section-problemet opfylde?", o: ["Mutual exclusion, progress, bounded waiting", "Atomicity, consistency, durability", "Mutual exclusion, fairness, priority", "Lock, unlock, wait"], a: 0, e: "Kun én ad gangen; nogen kommer altid ind når den er ledig; ingen venter for evigt." },
    { q: "Hvorfor bruge `std::lock_guard<std::mutex>` frem for lock()/unlock()?", o: ["RAII: låses op automatisk, også ved exceptions", "Den er hurtigere end en almindelig mutex", "Den lader flere tråde læse samtidig", "Den forhindrer automatisk deadlocks mellem to eller flere mutexer"], a: 0, e: "Glemt unlock() er en klassisk fejl." },
    { q: "Hvorfor står `cv.wait()` i en while-løkke (eller med predicate)?", o: ["Spurious wakeups – betingelsen kan være falsk", "Fordi wait() kun venter 1 ms ad gangen", "Fordi compileren kræver det for CV'er", "For at spare CPU mens tråden venter"], a: 0, e: "cv.wait(lock, []{ return !q.empty(); }) gør tjekket for dig." },
    { q: "Hvilken låsetype kræver `std::condition_variable::wait`?", o: ["std::unique_lock<std::mutex>", "std::lock_guard<std::mutex>", "std::mutex direkte", "std::shared_lock"], a: 0, e: "wait skal kunne låse op og låse igen – det kan lock_guard ikke." },
    { q: "Semafor: hvad gør wait (P) og signal (V)?", o: ["wait tæller ned/blokerer ved 0; signal tæller op", "wait tæller op; signal tæller ned og blokerer ved 0", "Begge låser og låser en intern mutex op", "wait nulstiller; signal sætter tælleren til 1"], a: 0, e: "En tællende semafor kan styre adgang til N ens ressourcer. Binær semafor ≈ mutex (men uden ejerskab)." },
    { q: "Hvilken hardware-instruktion bruges til at bygge låse?", o: ["Atomisk test-and-set / compare-and-swap", "Memory barrier alene (fence)", "Almindelig load efterfulgt af store", "At slå interrupts fra på en multicore-CPU"], a: 0, e: "Atomiske instruktioner læser og skriver i ét udeleligt trin." },
    { q: "Hvad er lock contention?", o: ["Mange tråde venter på samme lås", "En lås der aldrig bliver frigivet", "To låse beskytter samme variabel", "En lås der ejes af en død tråd"], a: 0, e: "Løsning: mindre kritiske sektioner, finere låse eller lock-free strukturer." },
  ]},
  { id: "deadlock", title: "Deadlocks", sub: "Coffman, RAG, dining philosophers", questions: [
    { q: "Hvilke fire betingelser skal ALLE være opfyldt for deadlock?", o: ["Mutual exclusion, hold and wait, no preemption, circular wait", "Race condition, starvation, livelock, busy waiting", "Mutual exclusion, progress, bounded waiting og priority inversion", "Hold and wait, preemption, starvation, circular wait"], a: 0, e: "Coffman-betingelserne. Fjern én, og deadlock kan ikke opstå." },
    { q: "Alle tråde låser altid mutex A før mutex B. Hvilken betingelse brydes?", o: ["Circular wait", "Mutual exclusion", "No preemption", "Hold and wait"], a: 0, e: "Global låse-rækkefølge gør en cykel umulig." },
    { q: "Resource Allocation Graph med én instans pr. ressource indeholder en cykel. Hvad betyder det?", o: ["Der er deadlock", "Der kan være deadlock", "Der er ikke deadlock", "Grafen er ugyldig"], a: 0, e: "Med flere instanser pr. ressource er en cykel kun en mulighed, ikke en garanti." },
    { q: "Banker's algorithm er et eksempel på …", o: ["Deadlock avoidance", "Deadlock prevention", "Detection og recovery", "Ignorering (ostrich)"], a: 0, e: "Den tillader kun tildelinger, der holder systemet i en sikker tilstand." },
    { q: "Dining philosophers: alle tager venstre gaffel samtidig. Hvad sker der?", o: ["Deadlock – alle venter på højre gaffel", "Starvation – én filosof får aldrig spist", "Livelock – de lægger gaflerne og prøver igen", "Intet – de spiser bare på skift"], a: 0, e: "Løsninger: én filosof tager højre først, højst 4 ved bordet, eller tag begge atomisk." },
    { q: "Hvilket C++-værktøj låser flere mutexer uden risiko for deadlock?", o: ["std::scoped_lock lk(m1, m2);", "To lock_guard i træk", "std::mutex::try_lock i en løkke uden backoff", "std::atomic<bool>"], a: 0, e: "scoped_lock (og std::lock) bruger en deadlock-undgående algoritme." },
  ]},
  { id: "fileio", title: "POSIX File I/O", sub: "open/read/write, non-blocking, poll", questions: [
    { q: "Hvad returnerer `open()`?", o: ["En fd (int ≥ 0), eller -1 med errno sat", "En FILE*-pointer, eller NULL med errno sat ved fejl", "Filens størrelse i bytes", "true ved succes, false ved fejl"], a: 0, e: "FILE* er C-biblioteket (fopen). POSIX bruger int-descriptorer." },
    { q: "`read(fd, buf, 100)` returnerer 0. Hvad betyder det?", o: ["End of file", "Fejl", "Prøv igen", "100 bytes læst"], a: 0, e: "-1 er fejl. 0 er EOF. Et positivt tal er antal læste bytes (kan være < 100)." },
    { q: "Hvilke file descriptors er stdin, stdout og stderr?", o: ["0, 1, 2", "1, 2, 3", "0, 1, -1", "-1, 0, 1"], a: 0, e: "Derfor virker `2>fejl.log` i bash." },
    { q: "Hvordan gør man en fd non-blocking med fcntl?", code:
`int flags = fcntl(fd, F_GETFL);
fcntl(fd, F_SETFL, ???);`, o: ["flags | O_NONBLOCK", "O_NONBLOCK", "flags & O_NONBLOCK", "~O_NONBLOCK"], a: 0, e: "Hent de eksisterende flag og OR det nye på – ellers mister du de andre flag." },
    { q: "Non-blocking read og ingen data er klar. Hvad sker der?", o: ["read returnerer -1 med errno EAGAIN", "read blokerer alligevel indtil data", "read returnerer 0 (end of file)", "read returnerer bufferstørrelsen"], a: 0, e: "Det er ikke en rigtig fejl – prøv igen senere." },
    { q: "Hvad gør `poll()`?", o: ["Venter på at én af flere fds bliver klar", "Læser fra alle fds på én gang", "Lukker fds der ikke har været brugt", "Tjekker om en fd har læserettigheder"], a: 0, e: "Undgår busy-waiting. Til GPIO-interrupts via sysfs venter man på POLLPRI." },
    { q: "Hvad er forskellen på edge- og level-triggered?", o: ["Edge: ved ændringen. Level: så længe niveauet holder", "Edge: så længe niveauet holder. Level: ved ændringen", "Edge er hurtigere hardware, level er langsommere", "Ingen – det er to navne for samme mekanisme"], a: 0, e: "En knap med edge 'rising' giver ét event pr. tryk." },
    { q: "Hvad bruges `ioctl()` til?", o: ["Device-specifik kontrol, fx I2C-slaveadresse", "Læse og skrive almindelige tekstfiler", "Oprette en ny proces fra en fd", "Allokere hukommelse til en driver"], a: 0, e: "Alt der ikke passer i read/write-modellen." },
  ]},
  { id: "msg", title: "Message passing og queues", sub: "Producer-consumer, variant, move", questions: [
    { q: "Bounded buffer (producer-consumer). Hvad skal man bruge?", o: ["En mutex og to CV'er (not full / not empty)", "Kun en mutex rundt om bufferen", "Kun std::atomic på læse- og skriveindeks", "En semafor pr. element i bufferen"], a: 0, e: "Producenten venter når bufferen er fuld, forbrugeren når den er tom." },
    { q: "Hvad er `std::variant<int, std::string>`?", o: ["En sum type: præcis én af typerne ad gangen", "En struct der indeholder både int og string", "En container der kan holde flere værdier", "En smart pointer til enten int eller string"], a: 0, e: "Algebraic data type – en type-sikker union." },
    { q: "Hvad sker der her?", code:
`std::variant<int, std::string> v = std::string("hej");
int x = std::get<int>(v);`, o: ["std::bad_variant_access kastes", "x bliver 0 (default-værdi)", "Compile-fejl ved std::get", "x bliver 3 (strengens længde)"], a: 0, e: "v holder en string. Brug std::holds_alternative eller std::visit for sikker adgang." },
    { q: "Hvad gør `std::visit`?", o: ["Kalder visitoren med den aktive værdi", "Gennemløber alle typer i variant'en", "Besøger alle elementer i en container", "Tjekker om variant'en er tom"], a: 0, e: "Typisk med en overloaded lambda-struct – ét tilfælde pr. besked-type." },
    { q: "Hvad gør `std::move(x)`?", o: ["Caster x til rvalue, så den kan flyttes", "Flytter x til en ny adresse i hukommelsen", "Sletter x og frigiver dens hukommelse", "Laver en dyb kopi af x"], a: 0, e: "Selve flytningen sker i move-konstruktøren. Bagefter er x gyldig men i ukendt tilstand." },
    { q: "Hvad er en message broker?", o: ["Mellemmand der router beskeder (pub/sub)", "En mutex der beskytter en beskedkø", "En tråd der kun sender beskeder videre", "En exception-type der kastes når køen er fuld"], a: 0, e: "Afkobler komponenter: afsenderen behøver ikke kende modtageren." },
    { q: "Hvorfor sende `std::unique_ptr<Message>` gennem køen?", o: ["Klart ejerskab: præcis én ejer ad gangen, ingen kopiering", "Det er hurtigere end int", "Det kræves af std::queue", "For at kunne dele beskeden mellem tråde samtidig"], a: 0, e: "Producenten move'er beskeden ind; forbrugeren ejer den bagefter." },
  ]},
  { id: "serial", title: "Serial I/O: I2C og SPI", sub: "Busser og Linux-interfaces", questions: [
    { q: "Hvilke ledninger bruger I2C?", o: ["SDA og SCL", "MOSI, MISO, SCLK, CS", "TX og RX", "D+ og D-"], a: 0, e: "To ledninger, delt af alle enheder. Enhederne adresseres (typisk 7-bit adresse)." },
    { q: "Hvilke ledninger bruger SPI?", o: ["MOSI, MISO, SCLK og CS pr. enhed", "SDA og SCL, delt af alle", "TX og RX, krydset", "MOSI og SCLK, ingen CS"], a: 0, e: "Fuld duplex: der sendes og modtages samtidig." },
    { q: "Hvorfor skal I2C have pull-up-modstande?", o: ["Linjerne er open-drain – kan kun trække lavt", "For at begrænse strømmen ind i enhederne", "For at beskytte enhederne mod kortslutning til jord", "For at sætte bussens hastighed"], a: 0, e: "Pull-up trækker linjen høj når ingen driver den lav." },
    { q: "Rækkefølgen med i2c-dev i Linux?", o: ["open(\"/dev/i2c-1\") → ioctl(I2C_SLAVE) → read/write", "ioctl(I2C_SLAVE) → open(\"/dev/i2c-1\") → close", "open(\"/dev/i2c-1\") → write(addr) → read", "mmap(\"/dev/i2c-1\") → poll → read"], a: 0, e: "ioctl vælger hvilken slave efterfølgende read/write går til." },
    { q: "Hvilken typisk I2C-adresse har SSD1306 OLED-displayet?", o: ["0x3C", "0x68", "0x00", "0xFF"], a: 0, e: "0x3C (eller 0x3D). BMI160 bruges via SPI i kurset." },
    { q: "Hvad sender modtageren efter hver byte på I2C?", o: ["ACK eller NACK", "En CRC-checksum", "Sin egen adresse", "En STOP-betingelse"], a: 0, e: "Transaktionen indrammes af START og STOP-betingelser." },
    { q: "Hvordan laver man en SPI-overførsel med spidev?", o: ["ioctl(fd, SPI_IOC_MESSAGE(1), &tr)", "write(fd, buf, len) på /dev/i2c-1", "ioctl(fd, I2C_SLAVE, addr)", "poll(fd, POLLIN) og så read"], a: 0, e: "struct spi_ioc_transfer indeholder tx_buf, rx_buf, len og hastighed." },
  ]},
  { id: "mem", title: "Memory management og interrupts", sub: "Paging, MMU, DMA, ISR", questions: [
    { q: "Hvem oversætter virtuelle adresser til fysiske?", o: ["MMU'en", "Compileren", "Linkeren", "DMA-controlleren"], a: 0, e: "Ved hver hukommelsesadgang, med hjælp fra TLB som cache." },
    { q: "Sidestørrelse 4 KiB. Virtuel adresse 0x3A7F. Sidenummer og offset?", o: ["Side 0x3, offset 0xA7F", "Side 0x3A, offset 0x7F", "Side 0xA7F, offset 0x3", "Side 0x3A7, offset 0xF"], a: 0, e: "4 KiB = 2¹² → de nederste 12 bit (3 hex-cifre) er offset." },
    { q: "Hvilken fragmentering kan paging give?", o: ["Intern fragmentering", "Ekstern fragmentering", "Både intern og ekstern", "Ingen fragmentering"], a: 0, e: "Paging fjerner ekstern fragmentering, fordi alle frames er lige store." },
    { q: "Hvad er TLB?", o: ["En cache for sidetabel-opslag", "En hurtig type RAM til stacken", "En del af interrupt-controlleren", "En kø i CPU-scheduleren"], a: 0, e: "Translation Lookaside Buffer – sparer et ekstra hukommelsesopslag ved hver adgang." },
    { q: "Hvad gør DMA?", o: ["Enheden overfører til RAM uden CPU'en pr. byte", "Den krypterer hukommelsen mellem processer", "Den håndterer alle page faults i stedet for kernen", "Den fordeler tråde mellem CPU-kernerne"], a: 0, e: "CPU'en får et interrupt når overførslen er færdig." },
    { q: "Memory-mapped I/O vs port-mapped I/O?", o: ["MMIO: registre i adresserummet; port-mapped: in/out", "MMIO: kræver in/out; port-mapped: almindelige load/store", "De er det samme – kun navnet er forskelligt", "MMIO kræver DMA; port-mapped kræver interrupts"], a: 0, e: "ARM (RPi) bruger memory-mapped. Se /proc/iomem." },
    { q: "Hvad sker der ved et hardware-interrupt?", o: ["CPU'en gemmer tilstand og hopper til ISR'en", "Programmet afsluttes og genstartes", "CPU'en genstarter hele systemet", "Interruptet ventes på til næste context switch"], a: 0, e: "Bagefter genoprettes tilstanden og programmet fortsætter." },
    { q: "First fit, best fit, worst fit – hvad er det?", o: ["Strategier til at vælge et frit hukommelseshul", "Algoritmer til at vælge næste proces", "Måder at vælge sidestørrelse på", "Politikker for hvilken cache-linje der smides ud"], a: 0, e: "First fit er hurtigst; best fit efterlader små ubrugelige huller." },
  ]},
  { id: "raii", title: "RAII og smart pointers", sub: "unique, shared, weak", questions: [
    { q: "Hvad er RAII?", o: ["Erhverv i konstruktøren, frigiv i destruktoren", "Et mønster til at fange exceptions i main", "En måde at allokere alt på heapen", "En regel om altid at bruge raw pointers som medlemmer i klasser"], a: 0, e: "Resource Acquisition Is Initialization. Så rydder scope-slut altid op." },
    { q: "Hvad udskrives?", code:
`auto a = std::make_shared<int>(5);
auto b = a;
std::cout << a.use_count();`, o: ["2", "1", "5", "0"], a: 0, e: "To shared_ptr deler ejerskab. Objektet slettes når tælleren når 0." },
    { q: "Kan man kopiere en `std::unique_ptr`?", o: ["Nej – kun flytte med std::move", "Ja, altid", "Ja, men kun i samme tråd", "Kun hvis typen er int"], a: 0, e: "Copy-konstruktøren er slettet – det er hele pointen med 'unik'." },
    { q: "To objekter holder shared_ptr til hinanden. Hvad er problemet og løsningen?", o: ["Cyklus – tælleren når aldrig 0. Brug weak_ptr", "Dobbelt delete – brug raw pointers i stedet", "Crash ved oprettelse – brug unique_ptr begge veje", "Ingen problemer – shared_ptr opdager cykler"], a: 0, e: "weak_ptr tæller ikke med. Brug .lock() for midlertidigt at få en shared_ptr." },
    { q: "`void consume(std::unique_ptr<Msg> m)` – hvad siger signaturen?", o: ["Funktionen tager ejerskab (sink)", "Funktionen låner kun objektet", "Funktionen deler ejerskab", "Den kopierer beskeden"], a: 0, e: "Kalderen skal skrive consume(std::move(p)). Vil man kun låne: Msg& eller Msg*." },
    { q: "Hvorfor foretrække `std::make_unique<T>()` over `std::unique_ptr<T>(new T)`?", o: ["Exception-sikkerhed og ingen rå new", "Den er altid hurtigere i release", "Den laver en shared_ptr i stedet", "Den kræves for at kunne move'e"], a: 0, e: "make_shared giver desuden én allokering for objekt + kontrolblok." },
  ]},
  { id: "driver", title: "Linux device drivers", sub: "Moduler, major/minor, IRQ", questions: [
    { q: "Hvordan indlæses og fjernes et kernemodul?", o: ["insmod / rmmod", "make / make clean", "chmod / chown", "mount / umount"], a: 0, e: "module_init() og module_exit() angiver hvilke funktioner der køres." },
    { q: "Major og minor number – hvad identificerer de?", o: ["Major: driveren. Minor: enheden", "Major: versionen. Minor: patch", "Major: ejeren. Minor: gruppen", "Major: bussen. Minor: adressen"], a: 0, e: "Se med ls -l /dev – tallene står hvor filstørrelsen plejer." },
    { q: "Hvad er `struct file_operations`?", o: ["Funktionspointere til open, read, write m.fl.", "En global liste over alle åbne filer i hele systemet", "En POSIX-funktion der åbner device-filer", "Superblokken med filsystemets metadata"], a: 0, e: "Når user space kalder read() på /dev/mygpio, kalder kernen din .read-funktion." },
    { q: "Hvorfor bruge `copy_to_user()` i stedet for memcpy i en driver?", o: ["User-pointeren kan være ugyldig – den tjekkes", "Det er hurtigere end memcpy i kernen", "memcpy findes ikke i kernel-koden", "Det er kun en navnekonvention"], a: 0, e: "Kernen må aldrig stole på en adresse fra user space." },
    { q: "Hvordan implementerer en driver en blokerende read der venter på et interrupt?", o: ["wait_event_interruptible + wake_up i ISR'en", "while(1)-løkke der tjekker et flag", "msleep(1) i en løkke, indtil data fra enheden er klar", "Opret en kernel-tråd pr. read-kald"], a: 0, e: "Processen sover i en wait queue, indtil ISR'en vækker den." },
    { q: "Hvad må en interrupt handler (ISR) IKKE gøre?", o: ["Sove/blokere", "Læse et register", "Returnere IRQ_HANDLED", "Vække en wait queue"], a: 0, e: "ISR kører i interrupt-kontekst. Hold den kort, og udskyd tungt arbejde (fx til en workqueue/threaded IRQ)." },
    { q: "Hvordan logger man fra kernen, og hvor ser man det?", o: ["printk() – læs med dmesg", "printf() – læs i terminalen", "std::cout – læs i /var/log", "syslog() – læs i /proc"], a: 0, e: "Kernen har ingen libc, så printf findes ikke." },
  ]},
  { id: "build", title: "Build systems", sub: "Make og CMake", questions: [
    { q: "Hvornår genopbygger make et target?", o: ["Når en prerequisite er nyere end target", "Hver gang make køres", "Kun efter make clean", "Når filen er ændret i git"], a: 0, e: "Derfor er make inkrementelt – kun det ændrede bygges om." },
    { q: "Hvad skal recipe-linjer i en Makefile starte med?", o: ["Et TAB-tegn", "4 mellemrum", "Et $", "Et #"], a: 0, e: "Den klassiske 'missing separator'-fejl er mellemrum i stedet for TAB." },
    { q: "Hvad betyder `$@`, `$<` og `$^`?", code:
`app: main.o util.o
\tg++ -o $@ $^

%.o: %.cpp
\tg++ -c $< -o $@`, o: ["$@ target, $< første prereq., $^ alle prereq.", "$@ alle prereq., $< target, $^ første prereq.", "$@ første prereq., $< alle prereq., $^ target", "$@ compiler, $< flags, $^ output-fil"], a: 0, e: "Automatiske variabler gør regler generiske." },
    { q: "Hvorfor skrive `.PHONY: clean`?", o: ["Så make ikke tror clean er en fil", "For at gøre clean-reglen hurtigere", "For at skjule reglen fra make help", "Fordi alle targets skal være PHONY"], a: 0, e: "Uden .PHONY: findes en fil ved navn clean, sker der intet." },
    { q: "Hvad er CMake?", o: ["Meta-build system: genererer Makefiles/Ninja", "En C++-compiler ligesom g++ og clang", "En linker der erstatter ld", "En debugger til at køre build-fejl"], a: 0, e: "Det gør projektet cross-platform." },
    { q: "Minimal CMakeLists.txt til et program der linker til pthread?", code:
`cmake_minimum_required(VERSION 3.16)
project(App CXX)
add_executable(app main.cpp)
???`, o: ["target_link_libraries(app PRIVATE pthread)", "link_libraries(pthread) efter add_executable", "add_library(pthread) i samme fil", "include_directories(pthread)"], a: 0, e: "target_*-kommandoer er moderne CMake: egenskaber hører til et target." },
    { q: "Hvordan krydskompilerer man til Raspberry Pi med CMake?", o: ["Med en toolchain-fil (CMAKE_TOOLCHAIN_FILE)", "make ARCH=arm CROSS_COMPILE=pi", "Det kan CMake ikke – kun make", "Byg på PC'en og kopier binæren over"], a: 0, e: "Toolchain-filen angiver cross-compiler og sysroot." },
  ]},
  ]
},
{
  id: "ai", name: "AI", full: "AI-værktøjer", icon: "sparkles",
  units: [
  { id: "aitools", title: "Vælg det rigtige værktøj", sub: "Hvad bruger man til hvad", questions: [
    { q: "Du vil have en AI til at rette kode direkte i dit projekt, køre tests og lave commits. Hvilken type værktøj?", o: ["En coding agent som Claude Code eller Codex", "En billedgenerator", "En almindelig chatbot uden filadgang", "En søgemaskine"], a: 0, e: "Agenter kan læse og skrive filer og køre kommandoer – en chat kan kun foreslå." },
    { q: "Du skal forstå 10 PDF'er fra et kursus og stille spørgsmål til dem med kildehenvisninger. Bedste valg?", o: ["NotebookLM (eller et Claude-projekt)", "Midjourney med PDF'erne som input", "En ren billedgenerator", "Excel med Copilot"], a: 0, e: "NotebookLM svarer kun ud fra dine kilder og citerer dem – godt til eksamenslæsning." },
    { q: "Hvad er en context window?", o: ["Hvor meget tekst modellen ser på én gang", "Vinduet i appen hvor man skriver", "Modellens hukommelse mellem samtaler", "Hvor mange brugere der kan chatte ad gangen"], a: 0, e: "Når den er fuld, glemmer modellen det ældste eller man må opsummere." },
    { q: "Hvorfor kan en AI 'hallucinere'?", o: ["Den genererer sandsynlig tekst, ikke opslag", "Den læser forkerte hjemmesider i realtid under svaret", "Den er bevidst trænet til at lyve", "Det sker kun ved billedgenerering"], a: 0, e: "Bed om kilder, og tjek vigtige fakta." },
    { q: "Hvad er MCP (Model Context Protocol)?", o: ["En standard der kobler AI til værktøjer og data", "En ny AI-model fra Anthropic", "Et nyt programmeringssprog til at skrive AI-agenter i", "En GPU-type til at træne modeller"], a: 0, e: "Tænk 'USB-stik for AI': ét format, mange forbindelser." },
    { q: "Hvornår giver en stor 'reasoning'-model mest mening frem for en lille hurtig model?", o: ["Svære opgaver med mange trin", "Rette en enkelt stavefejl", "Oversætte ét ord", "Lave en indkøbsliste"], a: 0, e: "Små modeller er billigere og hurtigere til simple opgaver." },
    { q: "Du vil diktere noter i stedet for at skrive. Hvilken type værktøj?", o: ["Tale-til-tekst (Wispr Flow, Whisper)", "Billedgenerator (Midjourney)", "Kodeagent (Claude Code)", "Regneark med AI (Excel Copilot)"], a: 0, e: "Diktering er typisk 3× hurtigere end at skrive." },
  ]},
  ]
}
];
