export type Language = 'en' | 'de' | 'fr';

export interface Translations {
  [key: string]: {
    en: string;
    de: string;
    fr: string;
  };
}

export const translations: Translations = {
  // Header
  'header.title': {
    en: 'HeatMonitor Pro',
    de: 'HeatMonitor Pro',
    fr: 'HeatMonitor Pro'
  },
  'nav.dashboard': {
    en: 'Dashboard',
    de: 'Dashboard',
    fr: 'Tableau de bord'
  },
  'nav.analytics': {
    en: 'Analytics',
    de: 'Analytik',
    fr: 'Analytique'
  },
  'nav.files': {
    en: 'Files',
    de: 'Dateien',
    fr: 'Fichiers'
  },
  'nav.settings': {
    en: 'Settings',
    de: 'Einstellungen',
    fr: 'Paramètres'
  },
  
  // Dashboard
  'dashboard.title': {
    en: 'Heating System Dashboard',
    de: 'Heizungsanlagen-Dashboard',
    fr: 'Tableau de bord du système de chauffage'
  },
  'dashboard.subtitle': {
    en: 'Monitor your gas and solar heating performance',
    de: 'Überwachen Sie die Leistung Ihrer Gas- und Solarheizung',
    fr: 'Surveillez les performances de votre chauffage au gaz et solaire'
  },
  'dashboard.lastUpdated': {
    en: 'Last updated',
    de: 'Zuletzt aktualisiert',
    fr: 'Dernière mise à jour'
  },
  'dashboard.historicalData': {
    en: 'Historical Data Analysis',
    de: 'Historische Datenanalyse',
    fr: 'Analyse des données historiques'
  },
  'dashboard.analyzingPoints': {
    en: 'Analyzing',
    de: 'Analysiere',
    fr: 'Analyse de'
  },
  'dashboard.dataPoints': {
    en: 'data points',
    de: 'Datenpunkte',
    fr: 'points de données'
  },
  'dashboard.dataRange': {
    en: 'Data Range',
    de: 'Datenbereich',
    fr: 'Plage de données'
  },
  'dashboard.noData': {
    en: 'No Data Available',
    de: 'Keine Daten verfügbar',
    fr: 'Aucune donnée disponible'
  },
  'dashboard.uploadCsv': {
    en: 'Upload a CSV file to start monitoring your heating system',
    de: 'Laden Sie eine CSV-Datei hoch, um Ihr Heizsystem zu überwachen',
    fr: 'Téléchargez un fichier CSV pour commencer à surveiller votre système de chauffage'
  },
  'dashboard.filteredDataAnalysis': {
    en: 'Filtered Data Analysis',
    de: 'Gefilterte Datenanalyse',
    fr: 'Analyse des données filtrées'
  },
  'dashboard.showingFilteredPoints': {
    en: 'Showing',
    de: 'Zeige',
    fr: 'Affichage de'
  },
  'dashboard.ofTotalPoints': {
    en: 'of',
    de: 'von',
    fr: 'sur'
  },
  'dashboard.filteredRange': {
    en: 'Filtered Range',
    de: 'Gefilterter Bereich',
    fr: 'Plage filtrée'
  },
  'dashboard.noDataInRange': {
    en: 'No Data in Selected Range',
    de: 'Keine Daten im ausgewählten Bereich',
    fr: 'Aucune donnée dans la plage sélectionnée'
  },
  'dashboard.noDataBetween': {
    en: 'No data found between',
    de: 'Keine Daten gefunden zwischen',
    fr: 'Aucune donnée trouvée entre'
  },
  'dashboard.and': {
    en: 'and',
    de: 'und',
    fr: 'et'
  },
  'dashboard.adjustDateRange': {
    en: 'Try adjusting the date range.',
    de: 'Versuchen Sie, den Datumsbereich anzupassen.',
    fr: 'Essayez d\'ajuster la plage de dates.'
  },
  'dashboard.filter': {
    en: 'Filter',
    de: 'Filter',
    fr: 'Filtre'
  },
  'dashboard.from': {
    en: 'From:',
    de: 'Von:',
    fr: 'De:'
  },
  'dashboard.to': {
    en: 'To:',
    de: 'Bis:',
    fr: 'À:'
  },
  'dashboard.showing': {
    en: 'Showing',
    de: 'Zeige',
    fr: 'Affichage'
  },
  'dashboard.of': {
    en: 'of',
    de: 'von',
    fr: 'sur'
  },
  'dashboard.reset': {
    en: 'Reset',
    de: 'Zurücksetzen',
    fr: 'Réinitialiser'
  },
  'dashboard.applyFilter': {
    en: 'Apply Filter',
    de: 'Filter übernehmen',
    fr: 'Appliquer le filtre'
  },
  'dashboard.close': {
    en: 'Close',
    de: 'Schließen',
    fr: 'Fermer'
  },
  
  // Metrics
  'metrics.avgCollectorTemp': {
    en: 'Avg Collector Temp',
    de: 'Durchschn. Kollektor-Temp.',
    fr: 'Temp. moy. collecteur'
  },
  'metrics.outsideTemp': {
    en: 'Max Outside Temperature',
    de: 'Max. Außentemperatur',
    fr: 'Temp. ext. maximale'
  },
  'metrics.maxDhwTemp': {
    en: 'Max DHW Temp',
    de: 'Max. Warmwasser-Temp.',
    fr: 'Temp. max. ECS'
  },
  'metrics.waterPressure': {
    en: 'Water Pressure',
    de: 'Wasserdruck',
    fr: 'Pression d\'eau'
  },
  'metrics.solarActiveHours': {
    en: 'Solar Active Hours',
    de: 'Solar-Aktivstunden',
    fr: 'Heures d\'activité solaire'
  },
  'metrics.gasActiveHours': {
    en: 'Gas Active Hours',
    de: 'Gas-Aktivstunden',
    fr: 'Heures d\'activité gaz'
  },
  
  // Charts
  'chart.temperatureTrends': {
    en: 'Historical Temperature Trends',
    de: 'Historische Temperaturtrends',
    fr: 'Tendances historiques de température'
  },
  'chart.systemStatus': {
    en: 'Latest Data Point Status',
    de: 'Status des letzten Datenpunkts',
    fr: 'Statut du dernier point de données'
  },
  'chart.hourlyEfficiency': {
    en: 'Hourly System Efficiency',
    de: 'Stündliche Systemeffizienz',
    fr: 'Efficacité horaire du système'
  },
  'chart.waterPressure': {
    en: 'Water Pressure Monitoring',
    de: 'Wasserdrucküberwachung',
    fr: 'Surveillance de la pression d\'eau'
  },
  'chart.solarActivity': {
    en: 'Solar Water Heating Activity',
    de: 'Solar-Warmwasserheizungsaktivität',
    fr: 'Activité de chauffage solaire de l\'eau'
  },
  'chart.solarPowerAnalysis': {
    en: 'Solar Power Analysis',
    de: 'Solarleistungsanalyse',
    fr: 'Analyse de la puissance solaire'
  },
  'chart.gasPowerAnalysis': {
    en: 'Gas Power Analysis',
    de: 'Gasleistungsanalyse',
    fr: 'Analyse de la puissance gaz'
  },
  'chart.combinedPowerAnalysis': {
    en: 'Combined Solar & Gas Power Analysis',
    de: 'Kombinierte Solar- & Gasleistungsanalyse',
    fr: 'Analyse combinée puissance solaire & gaz'
  },
  'chart.powerAxis': {
    en: 'Power (kW)',
    de: 'Leistung (kW)',
    fr: 'Puissance (kW)'
  },
  'chart.combinedPowerNote': {
    en: 'Direct comparison of solar and gas power consumption patterns',
    de: 'Direkter Vergleich der Solar- und Gasleistungsverbrauchsmuster',
    fr: 'Comparaison directe des modèles de consommation solaire et gaz'
  },
  'chart.combinedPowerCalculationNote': {
    en: 'Solar and gas power calculations combined for comprehensive energy analysis',
    de: 'Solar- und Gasleistungsberechnungen kombiniert für umfassende Energieanalyse',
    fr: 'Calculs de puissance solaire et gaz combinés pour une analyse énergétique complète'
  },
  'chart.combinedBackgroundNote': {
    en: 'Orange background: solar active, Red background: gas active (can overlap)',
    de: 'Oranger Hintergrund: Solar aktiv, Roter Hintergrund: Gas aktiv (können sich überlappen)',
    fr: 'Arrière-plan orange: solaire actif, Arrière-plan rouge: gaz actif (peuvent se chevaucher)'
  },
  'chart.houseHeatingAnalysis': {
    en: 'House Heating Energy Analysis',
    de: 'Hausheizungs-Energieanalyse',
    fr: 'Analyse énergétique chauffage maison'
  },
  'chart.houseHeatingNote': {
    en: 'Energy used for house heating when solar pump is off and burner is active',
    de: 'Energie für Hausheizung bei ausgeschalteter Solarpumpe und aktivem Brenner',
    fr: 'Énergie utilisée pour le chauffage de la maison quand la pompe solaire est éteinte et le brûleur actif'
  },
  'chart.houseHeatingPower': {
    en: 'House Heating Power (kW)',
    de: 'Hausheizungsleistung (kW)',
    fr: 'Puissance chauffage maison (kW)'
  },
  'chart.houseHeatingEnergy': {
    en: 'House Heating Energy',
    de: 'Hausheizungsenergie',
    fr: 'Énergie chauffage maison'
  },
  'chart.houseHeatingActive': {
    en: 'House Heating Active',
    de: 'Hausheizung aktiv',
    fr: 'Chauffage maison actif'
  },
  'chart.totalHouseHeatingEnergy': {
    en: 'Total House Heating Energy',
    de: 'Gesamte Hausheizungsenergie',
    fr: 'Énergie totale chauffage maison'
  },
  'chart.houseHeatingPowerAxis': {
    en: 'House Heating Power (kW)',
    de: 'Hausheizungsleistung (kW)',
    fr: 'Puissance chauffage maison (kW)'
  },
  'chart.houseHeatingActiveBackground': {
    en: 'House Heating Active (Background)',
    de: 'Hausheizung aktiv (Hintergrund)',
    fr: 'Chauffage maison actif (Arrière-plan)'
  },
  'chart.houseHeatingActiveBackgroundDesc': {
    en: 'Blue background when house heating is active (solar pump off, burner on)',
    de: 'Blauer Hintergrund bei aktiver Hausheizung (Solarpumpe aus, Brenner an)',
    fr: 'Arrière-plan bleu quand le chauffage maison est actif (pompe solaire éteinte, brûleur allumé)'
  },
  'chart.houseHeatingPowerLegend': {
    en: 'House Heating Power',
    de: 'Hausheizungsleistung',
    fr: 'Puissance chauffage maison'
  },
  'chart.houseHeatingPowerDesc': {
    en: '10 kW × Boiler Modulation when solar pump off and burner active',
    de: '10 kW × Kesselmodulation bei ausgeschalteter Solarpumpe und aktivem Brenner',
    fr: '10 kW × Modulation chaudière quand pompe solaire éteinte et brûleur actif'
  },
  'chart.houseHeatingPowerCalculationNote': {
    en: 'House heating power: 10 kW × Boiler Modulation (%) when solar pump is off and burner is active',
    de: 'Hausheizungsleistung: 10 kW × Kesselmodulation (%) bei ausgeschalteter Solarpumpe und aktivem Brenner',
    fr: 'Puissance chauffage maison: 10 kW × Modulation chaudière (%) quand pompe solaire éteinte et brûleur actif'
  },
  'chart.blueBackgroundNote': {
    en: 'Blue background indicates periods when house heating system is actively heating',
    de: 'Blauer Hintergrund zeigt Zeiten an, in denen die Hausheizung aktiv heizt',
    fr: 'L\'arrière-plan bleu indique les périodes où le système de chauffage maison chauffe activement'
  },
  
  // Buttons
  'button.resetZoom': {
    en: 'Reset Zoom',
    de: 'Zoom zurücksetzen',
    fr: 'Réinitialiser le zoom'
  },
  'button.markPeriod': {
    en: 'Mark Period',
    de: 'Zeitraum markieren',
    fr: 'Marquer la période'
  },
  'button.clearMarkers': {
    en: 'Clear Markers',
    de: 'Markierungen löschen',
    fr: 'Effacer les marqueurs'
  },
  'button.clickToMark': {
    en: 'Click to Mark',
    de: 'Klicken zum Markieren',
    fr: 'Cliquer pour marquer'
  },
  
  // File Upload
  'upload.addHistoricalData': {
    en: 'Add Historical Data',
    de: 'Historische Daten hinzufügen',
    fr: 'Ajouter des données historiques'
  },
  'upload.dropCsvHere': {
    en: 'Drop CSV file here',
    de: 'CSV-Datei hier ablegen',
    fr: 'Déposer le fichier CSV ici'
  },
  'upload.clickToBrowse': {
    en: 'Drop your heating system CSV file here or click to browse',
    de: 'Legen Sie Ihre Heizungsanlagen-CSV-Datei hier ab oder klicken Sie zum Durchsuchen',
    fr: 'Déposez votre fichier CSV du système de chauffage ici ou cliquez pour parcourir'
  },
  'upload.processingCsv': {
    en: 'Processing CSV...',
    de: 'CSV wird verarbeitet...',
    fr: 'Traitement du CSV...'
  },
  'upload.csvFormat': {
    en: 'CSV Format Expected',
    de: 'CSV-Format erwartet',
    fr: 'Format CSV attendu'
  },
  'upload.additionalDataDescription': {
    en: 'Upload additional CSV files to expand your historical analysis. Data will be combined and sorted chronologically.',
    de: 'Laden Sie zusätzliche CSV-Dateien hoch, um Ihre historische Analyse zu erweitern. Die Daten werden kombiniert und chronologisch sortiert.',
    fr: 'Téléchargez des fichiers CSV supplémentaires pour étendre votre analyse historique. Les données seront combinées et triées chronologiquement.'
  },
  
  // Status
  'status.burnerState': {
    en: 'Burner State',
    de: 'Brennerzustand',
    fr: 'État du brûleur'
  },
  'status.solarStatus': {
    en: 'Solar Status',
    de: 'Solar-Status',
    fr: 'Statut solaire'
  },
  'status.collectorPump': {
    en: 'Collector Pump',
    de: 'Kollektorpumpe',
    fr: 'Pompe collecteur'
  },
  'status.boilerPump': {
    en: 'Boiler Pump',
    de: 'Kesselpumpe',
    fr: 'Pompe chaudière'
  },
  'status.dhwPump': {
    en: 'DHW Pump',
    de: 'Warmwasserpumpe',
    fr: 'Pompe ECS'
  },
  'status.fanSpeed': {
    en: 'Fan Speed',
    de: 'Lüftergeschwindigkeit',
    fr: 'Vitesse du ventilateur'
  },
  'status.lastUpdate': {
    en: 'Last Update',
    de: 'Letzte Aktualisierung',
    fr: 'Dernière mise à jour'
  },
  
  // Chart Labels
  'chart.collectorTemp': {
    en: 'Collector Temperature',
    de: 'Kollektortemperatur',
    fr: 'Température du collecteur'
  },
  'chart.outsideTemp': {
    en: 'Outside Temperature',
    de: 'Außentemperatur',
    fr: 'Température extérieure'
  },
  'chart.dhwTemp': {
    en: 'DHW Temperature',
    de: 'Warmwassertemperatur',
    fr: 'Température ECS'
  },
  'chart.flowTemp': {
    en: 'Flow Temperature',
    de: 'Vorlauftemperatur',
    fr: 'Température de départ'
  },
  'chart.b31Temp': {
    en: 'B31 Temperature',
    de: 'B31 Temperatur',
    fr: 'Température B31'
  },
  'chart.collectorTempB6': {
    en: 'Collector Temp (B6)',
    de: 'Kollektor-Temp. (B6)',
    fr: 'Temp. collecteur (B6)'
  },
  'chart.temperatureAxis': {
    en: 'Temperature (°C)',
    de: 'Temperatur (°C)',
    fr: 'Température (°C)'
  },
  'chart.solarEfficiency': {
    en: 'Solar Efficiency (%)',
    de: 'Solar-Effizienz (%)',
    fr: 'Efficacité solaire (%)'
  },
  'chart.gasUsage': {
    en: 'Gas Usage (%)',
    de: 'Gasverbrauch (%)',
    fr: 'Utilisation gaz (%)'
  },
  'chart.efficiencyAxis': {
    en: 'Efficiency (%)',
    de: 'Effizienz (%)',
    fr: 'Efficacité (%)'
  },
  'chart.waterPressureLabel': {
    en: 'Water Pressure (bar)',
    de: 'Wasserdruck (bar)',
    fr: 'Pression d\'eau (bar)'
  },
  'chart.pressureAxis': {
    en: 'Pressure (bar)',
    de: 'Druck (bar)',
    fr: 'Pression (bar)'
  },
  'chart.solarPower': {
    en: 'Solar Power (kW)',
    de: 'Solarleistung (kW)',
    fr: 'Puissance solaire (kW)'
  },
  'chart.tempDiffB6B31': {
    en: 'Temperature Diff B6-B31 (°C)',
    de: 'Temperaturdifferenz B6-B31 (°C)',
    fr: 'Différence temp. B6-B31 (°C)'
  },
  'chart.solarPowerAxis': {
    en: 'Solar Power (kW)',
    de: 'Solarleistung (kW)',
    fr: 'Puissance solaire (kW)'
  },
  'chart.gasPowerAxis': {
    en: 'Gas Power (kW)',
    de: 'Gasleistung (kW)',
    fr: 'Puissance gaz (kW)'
  },
  'chart.boilerModulationAxis': {
    en: 'Boiler Modulation (%)',
    de: 'Kesselmodulation (%)',
    fr: 'Modulation chaudière (%)'
  },
  'chart.temperatureDifferenceAxis': {
    en: 'Temperature Difference (°C)',
    de: 'Temperaturdifferenz (°C)',
    fr: 'Différence de température (°C)'
  },
  'chart.gasPowerCalculationNote': {
    en: 'Gas power calculation: 10 kW × Boiler Modulation (%) when DHW pump is active',
    de: 'Gasleistungsberechnung: 10 kW × Kesselmodulation (%) bei aktiver Warmwasserpumpe',
    fr: 'Calcul puissance gaz: 10 kW × Modulation chaudière (%) quand pompe ECS active'
  },
  'chart.powerCalculationNote': {
    en: 'Power calculation based on temperature difference (B6 - B31) when solar is active',
    de: 'Leistungsberechnung basierend auf Temperaturdifferenz (B6 - B31) bei aktiver Solaranlage',
    fr: 'Calcul de puissance basé sur la différence de température (B6 - B31) quand le solaire est actif'
  },
  'chart.zoomInstructions': {
    en: 'Use mouse wheel to zoom, drag to pan, or click Reset Zoom to return to full view',
    de: 'Mausrad zum Zoomen, Ziehen zum Verschieben oder Zoom zurücksetzen für Vollansicht',
    fr: 'Utilisez la molette pour zoomer, glissez pour déplacer, ou cliquez sur Réinitialiser le zoom'
  },
  'chart.zoomMarkingInstructions': {
    en: 'Use mouse wheel to zoom, drag to pan, mark periods for analysis, or reset zoom to return to full view',
    de: 'Mausrad zum Zoomen, Ziehen zum Verschieben, Zeiträume markieren oder Zoom zurücksetzen',
    fr: 'Molette pour zoomer, glisser pour déplacer, marquer des périodes ou réinitialiser le zoom'
  },
  'chart.solarActivePercent': {
    en: 'Solar active',
    de: 'Solar aktiv',
    fr: 'Solaire actif'
  },
  'chart.dataPoints': {
    en: 'data points',
    de: 'Datenpunkte',
    fr: 'points de données'
  },
  'chart.markingModeActive': {
    en: 'Marking Mode Active: Click on the chart to set',
    de: 'Markierungsmodus aktiv: Klicken Sie auf das Diagramm, um zu setzen',
    fr: 'Mode marquage actif: Cliquez sur le graphique pour définir'
  },
  'chart.startMarker': {
    en: 'START marker',
    de: 'START-Markierung',
    fr: 'marqueur DÉBUT'
  },
  'chart.endMarker': {
    en: 'END marker',
    de: 'END-Markierung',
    fr: 'marqueur FIN'
  },
  'chart.markedPeriodAnalysis': {
    en: 'Marked Period Analysis',
    de: 'Analyse des markierten Zeitraums',
    fr: 'Analyse de la période marquée'
  },
  'chart.start': {
    en: 'Start',
    de: 'Start',
    fr: 'Début'
  },
  'chart.end': {
    en: 'End',
    de: 'Ende',
    fr: 'Fin'
  },
  'chart.duration': {
    en: 'Duration',
    de: 'Dauer',
    fr: 'Durée'
  },
  'chart.solarActive': {
    en: 'Solar Active',
    de: 'Solar aktiv',
    fr: 'Solaire actif'
  },
  'chart.solarEnergy': {
    en: 'Solar Energy',
    de: 'Solarenergie',
    fr: 'Énergie solaire'
  },
  'chart.gasEnergy': {
    en: 'Gas Energy',
    de: 'Gasenergie',
    fr: 'Énergie gaz'
  },
  'chart.gasActive': {
    en: 'Gas Active',
    de: 'Gas aktiv',
    fr: 'Gaz actif'
  },
  'chart.avgCollectorTemp': {
    en: 'Avg Collector Temp',
    de: 'Durchschn. Kollektor-Temp.',
    fr: 'Temp. moy. collecteur'
  },
  'chart.avgDhwTemp': {
    en: 'Avg DHW Temp',
    de: 'Durchschn. Warmwasser-Temp.',
    fr: 'Temp. moy. ECS'
  },
  'chart.avgB31Temp': {
    en: 'Avg B31 Temp',
    de: 'Durchschn. B31-Temp.',
    fr: 'Temp. moy. B31'
  },
  
  // Chart Legend and Descriptions
  'chart.solarActiveBackground': {
    en: 'Solar Active (Background)',
    de: 'Solar aktiv (Hintergrund)',
    fr: 'Solaire actif (Arrière-plan)'
  },
  'chart.solarActiveBackgroundDesc': {
    en: 'Orange background when solar heating is active',
    de: 'Oranger Hintergrund bei aktiver Solarheizung',
    fr: 'Arrière-plan orange quand le chauffage solaire est actif'
  },
  'chart.collectorTempB6Legend': {
    en: 'Collector Temp (B6)',
    de: 'Kollektor-Temp. (B6)',
    fr: 'Temp. collecteur (B6)'
  },
  'chart.collectorTempB6Desc': {
    en: 'Solar collector temperature',
    de: 'Solarkollektortemperatur',
    fr: 'Température du collecteur solaire'
  },
  'chart.dhwTempLegend': {
    en: 'DHW Temp',
    de: 'Warmwasser-Temp.',
    fr: 'Temp. ECS'
  },
  'chart.dhwTempDesc': {
    en: 'Domestic hot water temperature',
    de: 'Warmwassertemperatur',
    fr: 'Température de l\'eau chaude sanitaire'
  },
  'chart.b31TempLegend': {
    en: 'B31 Temp (Boiler)',
    de: 'B31-Temp. (Kessel)',
    fr: 'Temp. B31 (Chaudière)'
  },
  'chart.b31TempDesc': {
    en: 'Temperature sensor down in boiler',
    de: 'Temperatursensor unten im Kessel',
    fr: 'Capteur de température en bas de la chaudière'
  },
  'chart.solarPowerLegend': {
    en: 'Solar Energy',
    de: 'Solarenergie',
    fr: 'Énergie solaire'
  },
  'chart.solarPowerDesc': {
    en: 'Calculated from B6-B31 temp difference',
    de: 'Berechnet aus B6-B31 Temperaturdifferenz',
    fr: 'Calculé à partir de la différence temp. B6-B31'
  },
  'chart.gasActiveBackground': {
    en: 'Gas Active (Background)',
    de: 'Gas aktiv (Hintergrund)',
    fr: 'Gaz actif (Arrière-plan)'
  },
  'chart.gasActiveBackgroundDesc': {
    en: 'Red background when gas heating is active (DHW pump on)',
    de: 'Roter Hintergrund bei aktiver Gasheizung (Warmwasserpumpe an)',
    fr: 'Arrière-plan rouge quand le chauffage gaz est actif (pompe ECS en marche)'
  },
  'chart.gasPowerLegend': {
    en: 'Gas Energy',
    de: 'Gasenergie',
    fr: 'Énergie gaz'
  },
  'chart.gasPowerDesc': {
    en: '10 kW × Boiler Modulation when DHW pump active',
    de: '10 kW × Kesselmodulation bei aktiver Warmwasserpumpe',
    fr: '10 kW × Modulation chaudière quand pompe ECS active'
  },
  'chart.boilerModulationLegend': {
    en: 'Boiler Modulation',
    de: 'Kesselmodulation',
    fr: 'Modulation chaudière'
  },
  'chart.boilerModulationDesc': {
    en: 'Boiler modulation percentage',
    de: 'Kesselmodulation in Prozent',
    fr: 'Pourcentage de modulation chaudière'
  },
  'chart.gasPower': {
    en: 'Gas Power (kW)',
    de: 'Gasleistung (kW)',
    fr: 'Puissance gaz (kW)'
  },
  'chart.boilerModulation': {
    en: 'Boiler Modulation (%)',
    de: 'Kesselmodulation (%)',
    fr: 'Modulation chaudière (%)'
  },
  'chart.temperatureDiffLegend': {
    en: 'Temperature Diff',
    de: 'Temperaturdifferenz',
    fr: 'Différence temp.'
  },
  'chart.temperatureDiffDesc': {
    en: 'B6 (collector) - B31 (boiler)',
    de: 'B6 (Kollektor) - B31 (Kessel)',
    fr: 'B6 (collecteur) - B31 (chaudière)'
  },
  'chart.totalSolarEnergy': {
    en: 'Total Solar Energy',
    de: 'Gesamte Solarenergie',
    fr: 'Énergie solaire totale'
  },
  'chart.totalGasEnergy': {
    en: 'Total Gas Energy',
    de: 'Gesamte Gasenergie',
    fr: 'Énergie gaz totale'
  },
  'chart.totalCombinedEnergy': {
    en: 'Total Combined Energy',
    de: 'Gesamte kombinierte Energie',
    fr: 'Énergie totale combinée'
  },
  'chart.note': {
    en: 'Note',
    de: 'Hinweis',
    fr: 'Note'
  },
  'chart.gasPowerFormula': {
    en: 'Gas power: 10 kW × Boiler Modulation (%) ÷ 100',
    de: 'Gasleistung: 10 kW × Kesselmodulation (%) ÷ 100',
    fr: 'Puissance gaz: 10 kW × Modulation chaudière (%) ÷ 100'
  },
  'chart.redBackgroundNote': {
    en: 'Red background indicates periods when gas system is actively heating',
    de: 'Roter Hintergrund zeigt Zeiten an, in denen die Gasanlage aktiv heizt',
    fr: 'L\'arrière-plan rouge indique les périodes où le système gaz chauffe activement'
  },
  'chart.solarPowerCalculationNote': {
    en: 'Solar power is calculated only when the solar system is active (pump on or charging status)',
    de: 'Solarleistung wird nur berechnet, wenn die Solaranlage aktiv ist (Pumpe an oder Ladestatus)',
    fr: 'La puissance solaire n\'est calculée que lorsque le système solaire est actif (pompe en marche ou état de charge)'
  },
  'chart.solarPowerFormula': {
    en: 'Solar power: Temperature difference (B6-B31) × flow rate (5.5 L/min) × specific heat (4.18 kJ/kg·K) ÷ 60',
    de: 'Solarleistung: Temperaturdifferenz (B6-B31) × Durchflussrate (5,5 L/min) × spezifische Wärme (4,18 kJ/kg·K) ÷ 60',
    fr: 'Puissance solaire: Différence de température (B6-B31) × débit (5,5 L/min) × chaleur spécifique (4,18 kJ/kg·K) ÷ 60'
  },
  'chart.energyValuesCumulative': {
    en: 'Energy values are cumulative over the data period',
    de: 'Energiewerte sind kumulativ über den Datenzeitraum',
    fr: 'Les valeurs d\'énergie sont cumulatives sur la période de données'
  },
  'chart.orangeBackgroundNote': {
    en: 'Orange background indicates periods when solar system is actively heating',
    de: 'Oranger Hintergrund zeigt Zeiten an, in denen die Solaranlage aktiv heizt',
    fr: 'L\'arrière-plan orange indique les périodes où le système solaire chauffe activement'
  },
  'chart.marking': {
    en: 'Marking',
    de: 'Markierung',
    fr: 'Marquage'
  },
  'chart.markingInstructions': {
    en: 'Click "Mark Period" then click two points on the chart to analyze a specific time period',
    de: 'Klicken Sie auf "Zeitraum markieren" und dann auf zwei Punkte im Diagramm, um einen bestimmten Zeitraum zu analysieren',
    fr: 'Cliquez sur "Marquer la période" puis cliquez sur deux points du graphique pour analyser une période spécifique'
  },
  
  // Analytics Dashboard
  'analytics.title': {
    en: 'Energy Analytics Dashboard',
    de: 'Energie-Analytik-Dashboard',
    fr: 'Tableau de bord analytique énergétique'
  },
  'analytics.subtitle': {
    en: 'Daily energy calculations and system performance metrics',
    de: 'Tägliche Energieberechnungen und Systemleistungsmetriken',
    fr: 'Calculs énergétiques quotidiens et métriques de performance du système'
  },
  'analytics.loadingData': {
    en: 'Loading analytics data...',
    de: 'Lade Analysedaten...',
    fr: 'Chargement des données analytiques...'
  },
  'analytics.errorLoadingData': {
    en: 'Error Loading Data',
    de: 'Fehler beim Laden der Daten',
    fr: 'Erreur de chargement des données'
  },
  'analytics.retry': {
    en: 'Retry',
    de: 'Wiederholen',
    fr: 'Réessayer'
  },
  'analytics.totalSolarEnergy': {
    en: 'Total Solar Energy',
    de: 'Gesamte Solarenergie',
    fr: 'Énergie solaire totale'
  },
  'analytics.totalGasEnergy': {
    en: 'Total Gas Energy',
    de: 'Gesamte Gasenergie',
    fr: 'Énergie gaz totale'
  },
  'analytics.totalCombinedEnergy': {
    en: 'Total Combined Energy',
    de: 'Gesamte kombinierte Energie',
    fr: 'Énergie totale combinée'
  },
  'analytics.avgDailyEnergy': {
    en: 'Avg Daily Energy',
    de: 'Durchschn. tägliche Energie',
    fr: 'Énergie quotidienne moyenne'
  },
  'analytics.ofTotal': {
    en: 'of total',
    de: 'der Gesamtmenge',
    fr: 'du total'
  },
  'analytics.daysAnalyzed': {
    en: 'days analyzed',
    de: 'Tage analysiert',
    fr: 'jours analysés'
  },
  'analytics.perDay': {
    en: 'per day',
    de: 'pro Tag',
    fr: 'par jour'
  },
  'analytics.energyTrendsOverTime': {
    en: 'Energy Trends Over Time',
    de: 'Energietrends im Zeitverlauf',
    fr: 'Tendances énergétiques dans le temps'
  },
  'analytics.dailyEnergyBreakdown': {
    en: 'Daily Energy Breakdown',
    de: 'Tägliche Energieaufschlüsselung',
    fr: 'Répartition énergétique quotidienne'
  },
  'analytics.totalEnergyDistribution': {
    en: 'Total Energy Distribution',
    de: 'Gesamte Energieverteilung',
    fr: 'Distribution énergétique totale'
  },
  'analytics.temperatureTrends': {
    en: 'Temperature Trends',
    de: 'Temperaturtrends',
    fr: 'Tendances de température'
  },
  'analytics.systemActivityTime': {
    en: 'System Activity Time',
    de: 'Systemaktivitätszeit',
    fr: 'Temps d\'activité du système'
  },
  'analytics.dailyEnergyCalculations': {
    en: 'Daily Energy Calculations',
    de: 'Tägliche Energieberechnungen',
    fr: 'Calculs énergétiques quotidiens'
  },
  'analytics.daysOfData': {
    en: 'days of data',
    de: 'Tage mit Daten',
    fr: 'jours de données'
  },
  'analytics.date': {
    en: 'Date',
    de: 'Datum',
    fr: 'Date'
  },
  'analytics.solarEnergyKwh': {
    en: 'Solar Energy (kWh)',
    de: 'Solarenergie (kWh)',
    fr: 'Énergie solaire (kWh)'
  },
  'analytics.gasEnergyKwh': {
    en: 'Gas Energy (kWh)',
    de: 'Gasenergie (kWh)',
    fr: 'Énergie gaz (kWh)'
  },
  'analytics.totalEnergyKwh': {
    en: 'Total Energy (kWh)',
    de: 'Gesamtenergie (kWh)',
    fr: 'Énergie totale (kWh)'
  },
  'analytics.solarActiveMin': {
    en: 'Solar Active (min)',
    de: 'Solar aktiv (min)',
    fr: 'Solaire actif (min)'
  },
  'analytics.gasActiveMin': {
    en: 'Gas Active (min)',
    de: 'Gas aktiv (min)',
    fr: 'Gaz actif (min)'
  },
  'analytics.avgCollectorC': {
    en: 'Avg Collector (°C)',
    de: 'Durchschn. Kollektor (°C)',
    fr: 'Collecteur moy. (°C)'
  },
  'analytics.avgOutsideC': {
    en: 'Avg Outside (°C)',
    de: 'Durchschn. Außen (°C)',
    fr: 'Extérieur moy. (°C)'
  },
  'analytics.noEnergyData': {
    en: 'No Energy Data Available',
    de: 'Keine Energiedaten verfügbar',
    fr: 'Aucune donnée énergétique disponible'
  },
  'analytics.energyCalculationsWillAppear': {
    en: 'Energy calculations will appear here once data is processed.',
    de: 'Energieberechnungen werden hier angezeigt, sobald die Daten verarbeitet sind.',
    fr: 'Les calculs énergétiques apparaîtront ici une fois les données traitées.'
  },
  'analytics.solarEnergy': {
    en: 'Solar Energy',
    de: 'Solarenergie',
    fr: 'Énergie solaire'
  },
  'analytics.gasEnergy': {
    en: 'Gas Energy',
    de: 'Gasenergie',
    fr: 'Énergie gaz'
  },
  'analytics.avgCollectorTemp': {
    en: 'Avg Collector Temp (°C)',
    de: 'Durchschn. Kollektor-Temp. (°C)',
    fr: 'Temp. moy. collecteur (°C)'
  },
  'analytics.avgOutsideTemp': {
    en: 'Avg Outside Temp (°C)',
    de: 'Durchschn. Außentemp. (°C)',
    fr: 'Temp. ext. moyenne (°C)'
  },
  'analytics.avgDhwTemp': {
    en: 'Avg DHW Temp (°C)',
    de: 'Durchschn. Warmwasser-Temp. (°C)',
    fr: 'Temp. moy. ECS (°C)'
  },
  'analytics.solarActiveMinutes': {
    en: 'Solar Active (minutes)',
    de: 'Solar aktiv (Minuten)',
    fr: 'Solaire actif (minutes)'
  },
  'analytics.gasActiveMinutes': {
    en: 'Gas Active (minutes)',
    de: 'Gas aktiv (Minuten)',
    fr: 'Gaz actif (minutes)'
  }
};
