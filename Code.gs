// === DEFINIZIONE DELLE COSTANTI PER LE COLONNE ===
// Foglio "Fatture"
const COL_FATT_ID = 1;             // Colonna A: ID Fattura
const COL_FATT_APPARTAMENTO_ID = 2; // Colonna B: Appartamento ID
const COL_FATT_DATA_INIZIO = 3;       // Colonna C: Data Inizio
const COL_FATT_DATA_FINE = 4;         // Colonna D: Data Fine
const COL_FATT_DATA_EMISSIONE = 5;    // Colonna E: Data Emissione
const COL_FATT_DATA_SCADENZA = 6;     // Colonna F: Data Scadenza
const COL_FATT_CONS_ELETTRICO = 7;    // Colonna G: Consumo Elettrico
const COL_FATT_IMP_ELETTRICO = 8;    // Colonna H: Importo Elettrico
const COL_FATT_CONS_ACQUA = 9;        // Colonna I: Consumo Acqua
const COL_FATT_IMP_ACQUA = 10;       // Colonna J: Importo Acqua
const COL_FATT_CONS_GAS = 11;         // Colonna K: Consumo Gas
const COL_FATT_IMP_GAS = 12;         // Colonna L: Importo Gas
const COL_FATT_IMP_TOTALE = 13;      // Colonna M: Importo Totale
const COL_FATT_STATO = 14;            // Colonna N: Stato
const COL_FATT_DATA_CREAZIONE = 15;   // Colonna O: Data Creazione
const COL_FATT_METODO_PAGAMENTO = 16; // Colonna P: Metodo Pagamento
const COL_FATT_NOTE_IMPORTANTI = 17; // Colonna Q: Note Importanti
const COL_FATT_SCONTO_PERCENTUALE = 18; // Colonna R: Sconto Percentuale
const COL_FATT_MOTIVO_SCONTO = 19; // Colonna S: Motivo Sconto
const COL_FATT_IMP_PAGATO = 20;       // Colonna T: Importo Pagato

// Foglio "Pagamenti"
const COL_PAG_ID = 1;               // Colonna A: ID
const COL_PAG_FATTURA_ID = 2;       // Colonna B: Fattura ID
const COL_PAG_CONDOMINIO_ID = 3;    // Colonna C: Condominio ID
const COL_PAG_APPARTAMENTO_ID = 4; // Colonna D: Appartamento ID
const COL_PAG_DATA_PAGAMENTO = 5;   // Colonna E: Data Pagamento
const COL_PAG_IMPORTO = 6;           // Colonna F: Importo
const COL_PAG_TIPO = 7;             // Colonna G: Tipo
const COL_PAG_METODO = 8;           // Colonna H: Metodo
const COL_PAG_RIFERIMENTO = 9;       // Colonna I: Riferimento
const COL_PAG_NOTE = 10;            // Colonna J: Note
const COL_PAG_DATA_CREAZIONE = 11;  // Colonna K: Data Creazione

/**
 * Mostra l'interfaccia utente per registrare un pagamento.
 * @param {string} fatturaId - L'ID della fattura.
 * @return {HtmlOutput} - L'output HTML da visualizzare in una finestra modale.
 */
function mostraRegistraPagamento(fatturaId) {
  try {
    // Recupera i dati della fattura (opzionale, per precompilare il form)
    const fattura = getFatturaById(fatturaId);

    // Crea un template HTML
    const template = HtmlService.createTemplateFromFile("RegistraPagamento");

    // Passa i dati al template (opzionale)
    template.fatturaId = fatturaId;
    template.fattura = fattura;

    // Valuta il template
    const htmlOutput = template.evaluate().setTitle("Registra Pagamento");

    // Restituisci l'output HTML
    return htmlOutput;

  } catch (error) {
    Logger.log("Errore in mostraRegistraPagamento: " + error);
    return HtmlService.createHtmlOutput("<p>Si è verificato un errore: " + error + "</p>");
  }
}

/**
 * Registra un pagamento nel foglio "Pagamenti" e aggiorna lo stato della fattura.
 * @param {string} fatturaId - L'ID della fattura.
 * @param {string} dataPagamento - La data del pagamento (in formato stringa).
 * @param {number} importoPagato - L'importo pagato.
 * @param {string} metodoPagamento - Il metodo di pagamento.
 * @param {string} riferimento - Il riferimento del pagamento (opzionale).
 * @param {string} note - Le note sul pagamento (opzionale).
 * @return {object} - Un oggetto con il risultato dell'operazione (successo o errore).
 */
function registraPagamento(fatturaId, dataPagamento, importoPagato, metodoPagamento, riferimento, note) {
  try {
    // 1. Validazione
    if (!fatturaId || !dataPagamento || !importoPagato || !metodoPagamento) {
      throw new Error("Dati pagamento mancanti");
    }

    // 2. Connessione al foglio di calcolo
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetFatture = ss.getSheetByName("Fatture"); // Sostituisci "Fatture" con il nome reale del tuo foglio
    const sheetPagamenti = ss.getSheetByName("Pagamenti"); // Sostituisci "Pagamenti" con il nome reale del tuo foglio

    // 3. Trova la fattura
    const fatturaRow = findFatturaRowById(sheetFatture, fatturaId);
    if (!fatturaRow) {
      throw new Error("Fattura non trovata");
    }

    // 4. Genera ID Pagamento
    const idPagamento = generateUniqueId("PAG");

    // 5. Formatta la data
    const dataPagamentoFormattata = Utilities.formatDate(new Date(dataPagamento), Session.getTimeZone(), "yyyy-MM-dd");

    // 6. Aggiungi pagamento al foglio "Pagamenti"
    sheetPagamenti.appendRow([idPagamento, fatturaId, getCondominioIdByFatturaId(fatturaId), getAppartamentoIdByFatturaId(fatturaId), dataPagamentoFormattata, importoPagato, "Acconto", metodoPagamento, riferimento, note, new Date()]);

    // 7. Calcola importo totale pagato
    const importoTotalePagato = calculateTotalPaidAmount(sheetPagamenti, fatturaId);

    // 8. Aggiorna "Importo Pagato" e "Stato" nel foglio "Fatture"
    sheetFatture.getRange(fatturaRow, COL_FATT_IMP_PAGATO).setValue(importoTotalePagato); // COL_FATT_IMP_PAGATO è l'indice della colonna "Importo Pagato"
    updateFatturaStatus(sheetFatture, fatturaRow, importoTotalePagato, sheetFatture.getRange(fatturaRow, COL_FATT_IMP_TOTALE).getValue()); // Passa anche l'importo totale

    // 9. Genera ricevuta (opzionale)
    const ricevutaHtml = generaRicevuta(idPagamento);

    return { success: true, message: "Pagamento registrato con successo", idPagamento: idPagamento, htmlRicevuta: ricevutaHtml };
  } catch (error) {
    Logger.log("Errore in registraPagamento: " + error);
    return { success: false, error: error.message };
  }
}

/**
 * Recupera l'ID del condominio dato l'ID della fattura.
 * @param {string} fatturaId - L'ID della fattura.
 * @return {string} - L'ID del condominio.
 */
function getCondominioIdByFatturaId(fatturaId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetFatture = ss.getSheetByName("Fatture");
    const fatturaRow = findFatturaRowById(sheetFatture, fatturaId);
    if (!fatturaRow) {
      throw new Error("Fattura non trovata");
    }
    return sheetFatture.getRange(fatturaRow, COL_FATT_CONDOMINIO_ID).getValue(); // Usa COL_FATT_CONDOMINIO_ID
  } catch (error) {
    Logger.log("Errore in getCondominioIdByFatturaId: " + error);
    return null;
  }
}

/**
 * Recupera l'ID dell'appartamento dato l'ID della fattura.
 * @param {string} fatturaId - L'ID della fattura.
 * @return {string} - L'ID dell'appartamento.
 */
function getAppartamentoIdByFatturaId(fatturaId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetFatture = ss.getSheetByName("Fatture");
    const fatturaRow = findFatturaRowById(sheetFatture, fatturaId);
    if (!fatturaRow) {
      throw new Error("Fattura non trovata");
    }

    return sheetFatture.getRange(fatturaRow, COL_FATT_APPARTAMENTO_ID).getValue(); // Usa COL_FATT_APPARTAMENTO_ID
  } catch (error) {
    Logger.log("Errore in getAppartamentoIdByFatturaId: " + error);
    return null;
  }
}

/**
 * Recupera i dati della fattura dal foglio "Fatture" dato un ID.
 * @param {string} fatturaId - L'ID della fattura.
 * @return {object} - Un oggetto con i dati della fattura.
 */
function getFatturaById(fatturaId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetFatture = ss.getSheetByName("Fatture"); // Sostituisci "Fatture" con il nome reale del tuo foglio

    const fatturaRow = findFatturaRowById(sheetFatture, fatturaId);

    if (!fatturaRow) {
      throw new Error("Fattura non trovata");
    }

    // Costruisci un oggetto con i dati della fattura
    const fattura = {
      id: sheetFatture.getRange(fatturaRow, COL_FATT_ID).getValue(),
      dataEmissione: sheetFatture.getRange(fatturaRow, COL_FATT_DATA_EMISSIONE).getValue(),
      importoTotale: sheetFatture.getRange(fatturaRow, COL_FATT_IMP_TOTALE).getValue(),
      importoPagato: sheetFatture.getRange(fatturaRow, COL_FATT_IMP_PAGATO).getValue(),
      stato: sheetFatture.getRange(fatturaRow, COL_FATT_STATO).getValue(),
      // ... (Aggiungi altri dati che ti servono)
    };

    return fattura;

  } catch (error) {
    Logger.log("Errore in getFatturaById: " + error);
    return null;
  }
}

/**
 * Trova la riga di una fattura nel foglio "Fatture" dato il suo ID.
 * @param {Sheet} sheet - Il foglio "Fatture".
 * @param {string} fatturaId - L'ID della fattura da cercare.
 * @return {number} - Il numero di riga della fattura (o null se non trovata).
 */
function findFatturaRowById(sheet, fatturaId) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][COL_FATT_ID - 1] === fatturaId) {
      return i + 1; // +1 perché gli indici di riga partono da 1
    }
  }
  return null;
}

/**
 * Genera un ID univoco per il pagamento.
 * @param {string} prefix - Un prefisso per l'ID (es. "PAG").
 * @return {string} - L'ID univoco.
 */
function generateUniqueId(prefix) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return prefix + "-" + timestamp + "-" + random;
}

/**
 * Calcola l'importo totale pagato per una fattura sommando i pagamenti nel foglio "Pagamenti".
 * @param {Sheet} sheet - Il foglio "Pagamenti".
 * @param {string} fatturaId - L'ID della fattura.
 * @return {number} - L'importo totale pagato.
 */
function calculateTotalPaidAmount(sheet, fatturaId) {
  let total = 0;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][COL_PAG_FATTURA_ID - 1] === fatturaId) {
      total += Number(data[i][COL_PAG_IMPORTO - 1]);
    }
  }
  return total;
}

/**
 * Aggiorna lo stato della fattura nel foglio "Fatture" in base all'importo pagato.
 * @param {Sheet} sheet - Il foglio "Fatture".
 * @param {number} row - Il numero di riga della fattura.
 * @param {number} importoPagato - L'importo pagato.
 * @param {number} importoTotale - L'importo totale della fattura.
 */
function updateFatturaStatus(sheet, row, importoPagato, importoTotale) {
  let nuovoStato = "Da Pagare";
  if (importoPagato >= importoTotale) {
    nuovoStato = "Pagata";
  } else if (importoPagato > 0) {
    nuovoStato = "Parzialmente Pagata";
  }

  sheet.getRange(row, COL_FATT_STATO).setValue(nuovoStato);
}

/**
 * Genera l'HTML per la ricevuta di pagamento.
 * @param {string} pagamentoId - L'ID del pagamento.
 * @return {string} - L'HTML della ricevuta.
 */
function generaRicevuta(pagamentoId) {
  try {
    // 1. Recupera i dati del pagamento
    const pagamento = getPagamentoById(pagamentoId);

    // 2. Recupera i dati della fattura
    const fattura = getFatturaById(pagamento.fatturaId);

    // 3. Crea un template HTML
    const template = HtmlService.createTemplateFromFile("RicevutaPagamento");

    // 4. Passa i dati al template
    template.pagamento = pagamento;
    template.fattura = fattura;

    // 5. Valuta il template
    const ricevutaHtml = template.evaluate().getContent();

    return ricevutaHtml;

  } catch (error) {
    Logger.log("Errore in generaRicevuta: " + error);
    return "<p>Si è verificato un errore nella generazione della ricevuta: " + error + "</p>";
  }
}

/**
 * Recupera i dati del pagamento dal foglio "Pagamenti" dato il suo ID.
 * @param {string} pagamentoId - L'ID del pagamento.
 * @return {object} - Un oggetto con i dati del pagamento.
 */
function getPagamentoById(pagamentoId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetPagamenti = ss.getSheetByName("Pagamenti"); // Sostituisci "Pagamenti" con il nome reale del tuo foglio

    const data = sheetPagamenti.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][COL_PAG_ID - 1] === pagamentoId) {
        return {
          id: data[i][COL_PAG_ID - 1],
          fatturaId: data[i][COL_PAG_FATTURA_ID - 1],
          dataPagamento: data[i][COL_PAG_DATA_PAGAMENTO - 1],
          importoPagato: data[i][COL_PAG_IMPORTO - 1],
          metodoPagamento: data[i][COL_PAG_METODO - 1],
          riferimento: data[i][COL_PAG_RIFERIMENTO - 1],
          note: data[i][COL_PAG_NOTE - 1]
        };
      }
    }

    throw new Error("Pagamento non trovato");

  } catch (error) {
    Logger.log("Errore in getPagamentoById: " + error);
    return null;
  }
}

/**
 * Funzione per mostrare l'interfaccia
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('RegistraPagamento')
      .evaluate()
      .setTitle('Registra Pagamento')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}
