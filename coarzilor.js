// ============================================
// coarde.js - Metoda coardei (falsi)
// ============================================

// Functie care cauta un interval unde functia schimba semnul
function cautaInterval(fn, a, b) {
    let n = 100;
    let pas = (b - a) / n;
    let xPrec = a;
    let yPrec = fn(a);
    
    for (let i = 1; i <= n; i++) {
        let xCurent = a + i * pas;
        let yCurent = fn(xCurent);
        
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
    return null;
}

// Metoda coardei pentru gasirea radacinii
function chords(fn, a, b, eps) {
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

    // Verific daca functia e definita la capete
    if (!isFinite(fa) || !isFinite(fb)) {
        rezultat.eroare = "Functia nu e definita la capetele intervalului.\n" +
            "f(" + a.toFixed(4) + ") = " + fa + "\n" +
            "f(" + b.toFixed(4) + ") = " + fb;
        return rezultat;
    }

    // Verific daca functia schimba semnul pe interval
    if (fa * fb > 0) {
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
    
    // Numar maxim de iteratii
    let maxIteratii = 1000;
    let k = 0;
    let xPrecedent = null; // aproximarea anterioara
    let xCurent;

    // Execut algoritmul
    while (k < maxIteratii) {
        k++;
        
        // Formula metodei coardei:
        // x_{n+1} = b - f(b) * (b - a) / (f(b) - f(a))
        let numitor = fb - fa;

        // Protejez impotriva impartirii la zero
        if (Math.abs(numitor) < 1e-15) {
            rezultat.eroare = "f(b) - f(a) ≈ 0 la iteratia " + k + 
                              ". Metoda coardei nu poate continua.";
            break;
        }

        xCurent = b - (fb * (b - a)) / numitor;
        
        // Verific daca xCurent e finit
        if (!isFinite(xCurent)) {
            rezultat.eroare = "Aproximatia a devenit infinita la iteratia " + k;
            break;
        }
        
        let fxCurent = fn(xCurent);
        
        // Verific daca functia e definita in xCurent
        if (!isFinite(fxCurent)) {
            rezultat.eroare = "Functia nu e definita in x = " + xCurent.toFixed(6);
            break;
        }

        // Calculez timpul pana la aceasta iteratie
        let timpCurent = performance.now() - timpStart;
        
        // Salvez datele iteratiei
        rezultat.iteratii.push({
            k: k,
            a: a,
            b: b,
            x: xCurent,
            fx: fxCurent,
            timp: timpCurent
        });

        // Verific criteriile de oprire
        let aConvergent = false;
        
        if (Math.abs(fxCurent) < eps) {
            aConvergent = true;
        }
        if (xPrecedent !== null && Math.abs(xCurent - xPrecedent) < eps) {
            aConvergent = true;
        }

        if (aConvergent || fxCurent === 0) {
            rezultat.radacina = xCurent;
            rezultat.fRadacina = fxCurent;
            rezultat.nrIteratii = k;
            break;
        }

        // Actualizez intervalul pentru urmatoarea iteratie
        if (fa * fxCurent < 0) {
            // Radacina e in [a, xCurent]
            b = xCurent;
            fb = fxCurent;
        } else {
            // Radacina e in [xCurent, b]
            a = xCurent;
            fa = fxCurent;
        }

        xPrecedent = xCurent;
    }

    // Calculez timpul total
    let timpSfarsit = performance.now();
    rezultat.timpTotal = timpSfarsit - timpStart;

    // Verific daca am gasit radacina
    if (rezultat.radacina === null && !rezultat.eroare) {
        rezultat.eroare = "Metoda coardei nu a convergent in " + maxIteratii + " iteratii.";
    }

    return rezultat;
}