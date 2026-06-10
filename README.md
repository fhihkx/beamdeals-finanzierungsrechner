# Beamdeals Finanzierungsrechner

Statische GitHub-Pages-App für die Einbindung per iFrame auf beamdeals.de. Der Rechner benötigt keine Kopf- oder Fußzeile und kann direkt als `index.html` veröffentlicht werden.

## Dateien

- `index.html` – Markup und Formularstruktur
- `styles.css` – Beamdeals-Branding, responsive Layout
- `script.js` – Berechnung, Pflichtfeldprüfung und PDF-Generierung
- `beam.deals.png` – Logo für Oberfläche und PDF-Angebote

## GitHub Pages

1. Neues Repository erstellen, z. B. `beamdeals-finanzierungsrechner`.
2. Alle Dateien in den Repository-Root laden.
3. In GitHub unter **Settings → Pages** die Quelle `main / root` aktivieren.
4. Die veröffentlichte URL in der Website per iFrame einbinden.

## iFrame-Beispiel

```html
<iframe
  src="https://USERNAME.github.io/beamdeals-finanzierungsrechner/"
  style="width:100%;height:1800px;border:0;display:block;"
  loading="lazy"
  title="Beamdeals Finanzierungsrechner">
</iframe>
```

## PDF-Angebote

PDF-Angebote können nur heruntergeladen werden, wenn zuerst eine Rate berechnet wurde und alle Pflichtfelder im Kontaktformular ausgefüllt sind.

Beim PDF werden Firmenname, Straße, Postleitzahl und Ort aus dem Kontaktformular in den Adressblock übernommen. Das Erstellungsdatum wird automatisch als Tagesdatum gesetzt. Finanzierungsart, Anschaffungspreis, Laufzeit, Mietsonderzahlung, monatliche Rate, Rate in Prozent und kalkulierter Restwert werden aus der aktuellen Berechnung übernommen.

Der Dateiname folgt dem Schema:

```text
Finanzierungsart_Unternehmen_Datum_beam.deals.pdf
```

## Anpassung der Faktoren

Die Faktoren liegen in `script.js` in `factorMatrix`. Falls echte Finanzierungspartner-Faktoren vorliegen, dort die Werte ersetzen.
