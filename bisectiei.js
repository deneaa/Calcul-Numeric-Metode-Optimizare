// ============================================
// bisection.js - Metoda bisectiei
// ============================================

// Functie care cauta un interval unde functia schimba semnul
function cautaInterval(fn, a, b) {
    let n = 100; // numar de subintervale
    let pas = (b - a) / n;
    let xPrec = a;
    let yPrec = fn(a);
    
    for (let i = 1; i <= n; i++) {
        let xCurent = a + i * pas;
        let yCurent = fn(xCurent);
        
        // Daca ambele valori sunt finite si au semne diferite
        if (isFinite(yPrec) && isFinite(yCurent) && yPrec * yCurent < 0) {
            return {
                a: xPrec,
                b: xCurent,
                fa: yPrec,
                fb: yCurent
            };
        }
        xPrec = xCurent;
        yPrec = yCurent;
    }
    return null; // nu am gasit schimbare de semn
}

// Metoda bisectiei pentru gasirea radacinii
function bisection(fn, a, b, eps) {
    // Structurez rezultatul
    let rezultat = {
        radacina: null,
        fRadacina: null,
        nrIteratii: 0,
        timpTotal: 0,
        iteratii: [],
        eroare: null
    };

    // Calculez valorile functiei la capete
    let fa = fn(a);
    let fb = fn(b);

    // Verific daca functia schimba semnul pe interval
    if (!isFinite(fa) || !isFinite(fb) || fa * fb > 0) {
        // Incerc sa gasesc un interval mai bun
        let sugestie = cautaInterval(fn, a, b);
        
        if (sugestie) {
            rezultat.eroare = "f(a)·f(b) > 0 pe intervalul dat.\n" +
                "f(" + a.toFixed(4) + ") = " + fa.toFixed(6) + "\n" +
                "f(" + b.toFixed(4) + ") = " + fb.toFixed(6) + "\n\n" +
                "Incearca intervalul: a = " + sugestie.a.toFixed(4) + 
                ", b = " + sugestie.b.toFixed(4) + "\n" +
                "f(" + sugestie.a.toFixed(4) + ") = " + sugestie.fa.toFixed(6) + "\n" +
                "f(" + sugestie.b.toFixed(4) + ") = " + sugestie.fb.toFixed(6);
        } else {
            rezultat.eroare = "f(a)·f(b) > 0 pe intervalul [" + 
                a.toFixed(4) + ", " + b.toFixed(4) + "]\n" +
                "f(a) = " + fa.toFixed(6) + ", f(b) = " + fb.toFixed(6) + "\n" +
                "Nu am gasit niciun subinterval cu schimbare de semn.";
        }
        return rezultat;
    }

    // Marchez timpul de start
    let timpStart = performance.now();
    
    // Numar maxim de iteratii (sa evit bucla infinita)
    let maxIteratii = 1000;
    let k = 0;

    // Execut algoritmul
    while (k < maxIteratii) {
        k++;
        
        // Calculez mijlocul intervalului
        let c = (a + b) / 2;
        let fc = fn(c);
        
        // Verific daca functia e definita in punctul c
        if (!isFinite(fc)) {
            rezultat.eroare = "Functia nu e definita in punctul x = " + c.toFixed(6);
            return rezultat;
        }

        // Calculez timpul pana la aceasta iteratie
        let timpCurent = performance.now() - timpStart;
        
        // Salvez datele iteratiei
        rezultat.iteratii.push({
            k: k,
            a: a,
            b: b,
            x: c,
            fx: fc,
            timp: timpCurent
        });

        // Verific conditia de oprire
        if (Math.abs(fc) < eps || (b - a) / 2 < eps) {
            rezultat.radacina = c;
            rezultat.fRadacina = fc;
            rezultat.nrIteratii = k;
            break;
        }

        // Aleg noul interval
        if (fa * fc < 0) {
            // Radacina e in [a, c]
            b = c;
            fb = fc;
        } else {
            // Radacina e in [c, b]
            a = c;
            fa = fc;
        }
    }

    // Calculez timpul total
    let timpSfarsit = performance.now();
    rezultat.timpTotal = timpSfarsit - timpStart;

    // Verific daca am depasit numarul maxim de iteratii
    if (rezultat.radacina === null) {
        rezultat.eroare = "Metoda bisectiei nu a convergent in " + maxIteratii + " iteratii.";
    }

    return rezultat;
}