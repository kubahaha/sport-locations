const football = {
  id: 'football',
  name: 'Piłka nożna',
  leagues: [
    { name: 'Liga Mistrzów UEFA', wikidataId: 'Q140455348', participants: 36 },
    { name: 'Liga Europy UEFA', wikidataId: 'Q140478672', participants: 36 },
    { name: 'Liga Konferencji UEFA', wikidataId: 'Q140455339', participants: 36 },
    { name: 'Ekstraklasa', wikidataId: 'Q139892146', participants: 18 },
    { name: '1. Liga', wikidataId: 'Q139892278', participants: 18 },
    { name: '2. Liga', wikidataId: 'Q139940116', participants: 18 },
    { name: '3. Liga (grupa 1)', wikidataId: 'Q141407107', participants: 18 },
    { name: '3. Liga (grupa 2)', wikidataId: 'Q141454683', participants: 18 },
    { name: '3. Liga (grupa 3)', wikidataId: 'Q141454692', participants: 18 },
    { name: '3. Liga (grupa 4)', wikidataId: 'Q141414428', participants: 18 },
    { name: '4. Liga (grupa dolnośląska)', wikidataId: 'Q141493028', participants: 18 },
    { name: '4. Liga (grupa kujawsko-pomorska)', wikidataId: 'Q141508273', participants: 18 },
    { name: '4. Liga (grupa lubelska)', wikidataId: 'Q141416127', participants: 16 },
    { name: '4. Liga (grupa świętokrzyska)', wikidataId: 'Q141488142', participants: 18 },
    { name: '4. Liga (grupa małopolska)', wikidataId: 'Q141466233', participants: 18 },
    { name: '4. Liga (grupa podkarpacka)', wikidataId: 'Q141467987', participants: 18 },
    { name: 'Klasa okręgowa (grupa lubelska)', wikidataId: 'Q141417681', participants: 14 },
    { name: 'Klasa okręgowa (grupa bielskopodlaska)', wikidataId: 'Q141431068', participants: 16 },
    { name: 'Klasa okręgowa (grupa chełmska)', wikidataId: 'Q141431646', participants: 14 },
    { name: 'Klasa okręgowa (grupa zamojska)', wikidataId: 'Q141432065', participants: 14 }
  ],
  presets: [
    {
        id: 'europuchary',
        name: 'Puchary UEFA',
        wikidataIds: ['Q140455348', 'Q140478672', 'Q140455339']
    },
    {
      id: 'central-soccer',
      name: 'Poziomy centralne',
      wikidataIds: ['Q139892146', 'Q139892278', 'Q139940116']
    },
    {
      id: 'third-division',
      name: '3. liga',
      wikidataIds: ['Q141407107', 'Q141454683', 'Q141454692', 'Q141414428']
    },
    {
      id: 'fourth-division',
      name: '4. liga',
      wikidataIds: ['Q141493028', 'Q141508273', 'Q141416127', 'Q141488142', 'Q141466233', 'Q141467987']
    },
    {
      id: 'regional-soccer',
      name: 'Klasa okręgowa',
      wikidataIds: ['Q141417681', 'Q141431068', 'Q141431646', 'Q141432065']
    },
    {
      id: 'all-soccer',
      name: 'Wszystkie dostępne ligi',
      wikidataIds: [
        'Q139892146', 'Q139892278', 'Q139940116',
        'Q141407107', 'Q141454683', 'Q141454692', 'Q141414428',
        'Q141416127', 'Q141488142', 'Q141466233', 'Q141467987',
        'Q141417681', 'Q141431068', 'Q141431646', 'Q141432065'
      ]
    }
  ]
};

const speedway = {
  id: 'speedway',
  name: 'Żużel',
  leagues: [
    { name: 'Speedway Ekstraliga', wikidataId: 'Q141451656', participants: 8 },
    { name: 'Speedway 2. Ekstraliga', wikidataId: 'Q141578791', participants: 8 },
    { name: 'Krajowa Liga Żużlowa', wikidataId: 'Q141579509', participants: 7 },
    { name: 'Premiership na żużlu (UK)', wikidataId: 'Q137921350', participants: 6 },
    { name: 'Championship na żużlu (UK)', wikidataId: 'Q137921371', participants: 9 }
  ],
  presets: [
    {
      id: 'speedwaypl',
      name: 'Wszystkie polskie ligi żużlowe',
      wikidataIds: ['Q141451656', 'Q141578791', 'Q141579509']
    },
    {
      id: 'speedwayuk',
      name: 'Wszystkie brytyjskie ligi żużlowe',
      wikidataIds: ['Q137921350', 'Q137921371']
    }
  ]
};

const volleyball = {
  id: 'volleyball',
  name: 'Siatkówka',
  leagues: [
    { name: 'Tauron Liga (mężczyźni)', wikidataId: 'Q141451817', participants: 14 },
    { name: 'Tauron Liga (kobiety)', wikidataId: 'Q141591599', participants: 12 }
  ],
  presets: [
    {
      id: 'vol1',
      name: 'Wszystkie ligi mężczyzn',
      wikidataIds: ['Q141451817']
    },
    {
      id: 'vol2',
      name: 'Wszystkie ligi kobiet',
      wikidataIds: ['Q141591599']
    }
  ]
};

const hockey = {
  id: 'hockey',
  name: 'Hokej na lodzie',
  leagues: [
    { name: 'Polska Hokej Liga', wikidataId: 'Q141591569', participants: 10 }
  ],
  presets: [
    {
      id: 'hockey1',
      name: 'Wszystkie ligi hokejowe w Polsce',
      wikidataIds: ['Q141591569']
    }
  ]
};

export const sports = [football, speedway, volleyball, hockey];

function leagueIdFromWikidataId(wikidataId) {
  return wikidataId;
}

export const leagues = sports.flatMap((sport) =>
  sport.leagues.map((league) => ({
    ...league,
    id: leagueIdFromWikidataId(league.wikidataId),
    sportId: sport.id
  }))
);

const leagueIdByWikidataId = new Map(
  leagues.map((league) => [league.wikidataId, league.id])
);

export const leaguePresets = [
  ...sports.flatMap((sport) =>
    sport.presets.map((preset) => ({
      id: preset.id,
      sport: sport.id,
      name: preset.name,
      leagueIds: preset.wikidataIds.map((wikidataId) => leagueIdByWikidataId.get(wikidataId))
    }))
  ),
  {
    id: 'all-leagues',
    sport: 'all',
    name: 'Wszystkie ligi',
    leagueIds: leagues.map((league) => league.id)
  }
];