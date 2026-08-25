// src/i18n/index.js
// Deliberately lightweight — a flat key/value dictionary per language and a
// single t(key, vars) lookup, no external i18n library. Covers the main
// menu, settings, HUD chrome (prompts/toasts/action labels), and the
// inventory/enchant/skill panels. Deep per-item flavor text (ore names,
// stat labels, shop descriptions) stays in English/data-driven form — that
// content lives in config/*.js and would need per-item translation tables
// of its own, out of scope here.

const STORAGE_KEY = 'pixelforge_lang_v1';

const STRINGS = {
  en: {
    // Main menu
    menu_title: 'Pixelforge',
    menu_subtitle: 'Mine your fortune. Forge your legend.',
    menu_start: 'Start Game',
    menu_howto: 'How to Play',
    menu_credits: 'Credits',
    menu_back: 'Back',

    // How to play
    howto_title: 'How to Play',
    howto_body:
      '• Drag the left joystick to move around.\n' +
      '• Hold the round button to MINE ore, or tap it to ATTACK in the dungeon.\n' +
      '• Visit the Blacksmith to forge swords and armor from ore.\n' +
      '• Visit the Enchanter to strengthen your gear with Enchant Fragments, and to level up Skills with Training Fragments.\n' +
      '• Open your Inventory to equip weapons, armor, up to 2 Passives (Tomes) and up to 2 Skills (Scrolls).\n' +
      '• Equipped Skills appear as buttons next to the action button — tap to activate, watch the cooldown.\n' +
      '• Dive into the Abandoned Mine dungeon to fight monsters for gold, XP, ore, Tomes, Scrolls and Fragments.\n' +
      '• Adjust volume and language any time from Settings (gear icon, top right).',

    // Credits
    credits_title: 'Credits',
    credits_body: 'Created by Axel — London.\n\nThanks for playing Pixelforge!',

    // Settings
    settings_title: 'Settings',
    settings_audio: 'Audio',
    settings_master_volume: 'Master Volume',
    settings_music_volume: 'Music Volume',
    settings_sfx_volume: 'Sound Effects',
    settings_language: 'Language',
    lang_en: 'English',
    lang_id: 'Indonesian',

    // HUD / action
    action_mine: 'MINE',
    action_attack: 'ATTACK',

    // Inventory panel
    inv_title: 'Inventory',
    inv_ore: 'Ore',
    inv_equipment: 'Equipment',
    inv_passives: 'Passives (max 2 equipped)',
    inv_skills: 'Skills (max 2 equipped)',
    inv_oreindex: 'Ore Index',
    inv_hint: 'Sell ore and gear at the NPC Shop for gold.',
    inv_no_ore: 'No ore yet — start mining!',
    inv_no_equipment: 'No equipment yet — visit the Blacksmith.',
    inv_no_passives: 'No Tomes yet — defeat dungeon enemies for a chance to find one.',
    inv_no_skills: 'No Skill Scrolls yet — defeat dungeon enemies for a chance to find one.',
    equip: 'Equip',
    unequip: 'Unequip',
    equipped_suffix: ' (equipped)',
    ore_index_discovered_count: '{count} / {total} discovered',
    ore_index_undiscovered: '??? Undiscovered',
    fragments_enchant: 'Enchant Fragments',
    fragments_training: 'Training Fragments',
    skill_level: 'Level',

    // Enchanter NPC
    enchant_title: 'Enchanter',
    enchant_sub: 'Strengthen your equipped gear with Enchant Fragments, or level up your Skill Scrolls with Training Fragments.',
    enchant_tab_gear: 'Enchant Gear',
    enchant_tab_skills: 'Upgrade Skills',
    enchant_no_sword: 'No sword equipped.',
    enchant_no_armor: 'No armor equipped.',
    enchant_max_level: 'Max enchant level reached',
    enchant_btn: 'Enchant',
    enchant_cost: 'Cost',
    enchant_success_toast: 'Enchanted {name} to level {level}!',
    enchant_fail_toast: 'Not enough Enchant Fragments.',
    skill_upgrade_btn: 'Upgrade',
    skill_upgrade_max: 'Max level',
    skill_upgrade_success_toast: '{name} upgraded to level {level}!',
    skill_upgrade_fail_toast: 'Not enough Training Fragments.',

    // Toasts / prompts (dynamic, engine.js)
    prompt_mine_enter: 'Tap MINE to enter the mines',
    prompt_blacksmith: 'Tap MINE to open the Forge',
    prompt_shop: 'Tap MINE to open the Shop',
    prompt_enchanter: 'Tap MINE to open the Enchanter',
    prompt_auction: 'Tap MINE to open the Auction House',
    prompt_storage: 'Tap MINE to open Storage',
    prompt_dungeon_ticket: 'Tap MINE to enter Abandoned Mine (use 1 Ticket — have {count})',
    prompt_dungeon_gold: 'Tap MINE to enter Abandoned Mine ({cost}g)',
    prompt_exit_village: 'Tap MINE to exit to Village',
    prompt_exit_floor: 'Tap MINE to exit to {name}',
    prompt_enter_floor: 'Tap MINE to enter the {name}',
    prompt_level_req: 'Requires Level {level} (you are Level {current})',
    prompt_mine_hold: 'Hold MINE to mine {ore}',
    prompt_retreat: 'Tap ATTACK to retreat to Village',
    toast_level_req: '{name} requires Level {level}',
    toast_used_ticket: 'Used a Dungeon Ticket',
    toast_need_gold: 'Need {cost}g for a dungeon ticket',
    toast_no_ore: 'No ore this time... ({chance}% chance)',
    toast_level_up: 'Level up! Now Lv.{level}',
    toast_floor_cleared: 'Floor {floor} cleared! Descending to floor {next}...',
    toast_passive_found: 'Found: {quality} {name}',
    toast_skill_found: 'Found: {quality} {name}',
    toast_skill_ready: '{name} is ready!',
    toast_skill_cooldown: '{name} is on cooldown',
    toast_max_passives: 'You can only equip {max} Passives at a time',
    toast_max_skills: 'You can only equip {max} Skills at a time',

    common_close: 'Close',
    common_back: 'Back',
    common_done: 'Done',

    // How to Play — restructured as an icon list (see index.html)
    howto_step_move: 'Drag the left joystick to move your character around the map.',
    howto_step_mine: 'Hold the round button to MINE ore, or tap it to ATTACK while inside a dungeon.',
    howto_step_forge: 'Visit the Blacksmith to forge swords and armor from the ore you mine.',
    howto_step_enchant: 'Visit the Enchanter to strengthen gear with Enchant Fragments, and level up Skills with Training Fragments.',
    howto_step_inventory: 'Open your Inventory to equip weapons, armor, up to 2 Passives (Tomes), and up to 2 Skills (Scrolls).',
    howto_step_skills: 'Equipped Skills appear as buttons next to the action button — tap to activate and watch the cooldown.',
    howto_step_dungeon: 'Dive into the Abandoned Mine to fight monsters for gold, XP, ore, Tomes, Scrolls and Fragments.',
    howto_step_progress: 'Track your Achievements and Quests any time from the trophy button, top right.',
    howto_step_settings: 'Adjust volume and language any time from Settings (gear icon, top right).',

    // Username modal
    username_title: 'Welcome to Pixelforge',
    username_sub: 'Pick a name — other players in the village will see it instead of "Player".',
    username_placeholder: 'Your name',
    username_confirm: 'Enter the Village',
    username_error_short: 'Name must be at least 2 characters.',

    // Debug console static chrome (index.html)
    debug_console_title: 'Debug Console',
    debug_input_placeholder: 'add money(500)',
    debug_run: 'Run',

    // ---------- Achievements ----------
    achievements_title: 'Achievements',
    achievements_sub: 'Milestones tracked automatically as you play — no need to claim them.',
    achievements_progress: '{unlocked} / {total} unlocked',
    achievements_locked_label: 'Locked',
    achievements_unlocked_label: 'Unlocked',
    achievements_reward_label: 'Reward',
    achievements_reward_debug: 'Unlocks Debug Mode',
    toast_achievement_unlocked: 'Achievement unlocked: {name}!',
    toast_debug_unlocked: 'Debug Mode unlocked! Look for the DEBUG tab, top right.',

    ach_first_ore_name: 'First Ore',
    ach_first_ore_desc: 'Discover your first ore.',
    ach_armed_name: 'Armed and Ready',
    ach_armed_desc: 'Forge or otherwise own a piece of equipment.',
    ach_level_5_name: 'First Steps',
    ach_level_5_desc: 'Reach character Level 5.',
    ach_level_25_name: 'Seasoned Miner',
    ach_level_25_desc: 'Reach character Level 25.',
    ach_level_50_name: 'Veteran Miner',
    ach_level_50_desc: 'Reach character Level 50.',
    ach_level_80_name: 'Legendary Miner',
    ach_level_80_desc: 'Reach character Level 80.',
    ach_dive_10_name: 'Dungeon Diver',
    ach_dive_10_desc: 'Clear floor 10 of the Abandoned Mine.',
    ach_dive_50_name: 'Dungeon Conqueror',
    ach_dive_50_desc: 'Clear floor 50 of the Abandoned Mine.',
    ach_ore_collector_name: 'Ore Collector',
    ach_ore_collector_desc: 'Discover 15 different kinds of ore.',
    ach_enchant_apprentice_name: 'Enchanter\u2019s Apprentice',
    ach_enchant_apprentice_desc: 'Enchant a piece of equipment for the first time.',
    ach_enchant_empowered_name: 'Empowered',
    ach_enchant_empowered_desc: 'Enchant a piece of equipment to +5.',
    ach_skilled_name: 'Skilled Adventurer',
    ach_skilled_desc: 'Have a Skill equipped.',
    ach_end_name: 'The End of All',
    ach_end_desc: 'Reach Level 120 and clear floor 100 of the Abandoned Mine.',

    // ---------- Quests ----------
    quests_title: 'Quests',
    quests_sub: 'Complete objectives to claim one-time rewards.',
    quests_progress: '{done} / {total} completed',
    quest_claim: 'Claim',
    quest_claimed: 'Claimed',
    quest_locked: 'In Progress',
    toast_quest_claimed: 'Quest reward claimed: {name}!',

    quest_gold_100_name: 'Nest Egg',
    quest_gold_100_desc: 'Have 100 gold at once.',
    quest_ore_50_name: 'Ore Collector',
    quest_ore_50_desc: 'Hold 50 total ore at once.',
    quest_forge_1_name: 'First Creation',
    quest_forge_1_desc: 'Own at least 1 piece of equipment.',
    quest_level_10_name: 'On the Rise',
    quest_level_10_desc: 'Reach character Level 10.',
    quest_dive_5_name: 'Into the Depths',
    quest_dive_5_desc: 'Clear floor 5 of the Abandoned Mine.',
    quest_equip_skill_name: 'Ready to Fight',
    quest_equip_skill_desc: 'Equip a Skill (Scroll).',
    quest_equip_passive_name: 'Steady Growth',
    quest_equip_passive_desc: 'Equip a Passive (Tome).',
    quest_dive_20_name: 'Deep Diver',
    quest_dive_20_desc: 'Clear floor 20 of the Abandoned Mine.',
    quest_level_50_name: 'Halfway There',
    quest_level_50_desc: 'Reach character Level 50.',
    quest_enchant_3_name: 'Fine-Tuned',
    quest_enchant_3_desc: 'Enchant a piece of equipment to +3.',

    reward_gold: '{amount}g',
    reward_dungeon_ticket: '{amount}x Dungeon Ticket',
    reward_enchant_fragments: '{amount}x Enchant Fragment',
    reward_training_fragments: '{amount}x Training Fragment',
    reward_ore: '{amount}x {name}',
    reward_ore_random: '{amount}x Random Ore',
    reward_skill_random: '1x Random Skill (Scroll)',
    reward_tome_random: '1x Random Passive (Tome)',

    // ---------- Progress (Achievements + Quests) HUD button/modal ----------
    progress_tab_achievements: 'Achievements',
    progress_tab_quests: 'Quests',
    progress_tab_daily: 'Daily',
    progress_tab_weekly: 'Weekly',

    // ---------- Daily Quests ----------
    daily_quests_title: 'Daily Quests',
    daily_quests_sub: 'Resets every day. 3 objectives are active at a time.',
    daily_mine_30_name: 'Daily Digger',
    daily_mine_30_desc: 'Mine 30 ore today.',
    daily_mine_60_name: 'Deep Shift',
    daily_mine_60_desc: 'Mine 60 ore today.',
    daily_gold_150_name: 'Quick Coin',
    daily_gold_150_desc: 'Earn 150 gold today.',
    daily_kill_8_name: 'Pest Control',
    daily_kill_8_desc: 'Defeat 8 enemies today.',
    daily_dive_1_name: "Today's Dive",
    daily_dive_1_desc: 'Complete 1 Abandoned Mine run today.',
    daily_enchant_1_name: 'Daily Upgrade',
    daily_enchant_1_desc: 'Enchant a piece of equipment today.',

    // ---------- Weekly Quests ----------
    weekly_quests_title: 'Weekly Quests',
    weekly_quests_sub: 'Resets every week. 3 objectives are active at a time.',
    weekly_mine_300_name: 'Weekly Excavation',
    weekly_mine_300_desc: 'Mine 300 ore this week.',
    weekly_mine_600_name: 'Ore Marathon',
    weekly_mine_600_desc: 'Mine 600 ore this week.',
    weekly_gold_1000_name: 'Big Earner',
    weekly_gold_1000_desc: 'Earn 1000 gold this week.',
    weekly_kill_40_name: 'Monster Cull',
    weekly_kill_40_desc: 'Defeat 40 enemies this week.',
    weekly_dive_5_name: 'Weekly Descent',
    weekly_dive_5_desc: 'Complete 5 Abandoned Mine runs this week.',
    weekly_enchant_3_name: "Smith's Discipline",
    weekly_enchant_3_desc: 'Enchant equipment 3 times this week.',

    // ---------- Debug Mode ----------
    debug_active_msg: 'Debug Mode active — no progression required. Type a command below, or type "help" for the full guide.',
    debug_help_title: '=== Pixelforge Debug Console — Command Guide ===',
    debug_help_money: 'add money (nominal)              Adds gold. e.g. add money(500)',
    debug_help_level: 'add level (level)                Adds/removes character levels. e.g. add level(5)',
    debug_help_setfloor: 'setfloor (lantai)                Jumps the current Abandoned Mine dive to a floor. e.g. setfloor(50)',
    debug_help_enchant_token: 'add enchant token (jumlah)       Adds Enchant Fragments. e.g. add enchant token(10)',
    debug_help_training_token: 'add training token (jumlah)      Adds Training Fragments. e.g. add training token(10)',
    debug_help_get_item: 'get item (id) (qty) [quality]    Grants ore/pickaxe/passive/skill by id. e.g. get item(iron,10)',
    debug_help_list_item: 'list item                        Lists every gettable item id.',
    debug_help_list_achievements: 'list achievement                Lists every achievement id and its status.',
    debug_help_list_quests: 'list quest                       Lists every quest id and its status.',
    debug_help_unlock_achievement: 'unlock achievement (id)          Force-unlocks one achievement by id (or "all").',
    debug_help_help: 'help / list command              Shows this guide again.',
    debug_setfloor_usage: 'Usage: setfloor (floor number)',
    debug_setfloor_ok: 'Jumped to floor {floor}.',
    debug_enchant_token_usage: 'Usage: add enchant token (amount)',
    debug_enchant_token_ok: '+{amount} Enchant Fragments. Total: {total}',
    debug_training_token_usage: 'Usage: add training token (amount)',
    debug_training_token_ok: '+{amount} Training Fragments. Total: {total}',
    debug_unlock_achievement_usage: 'Usage: unlock achievement (id) — try "list achievement" for ids, or "all"',
    debug_unlock_achievement_unknown: 'Unknown achievement id "{id}". Try "list achievement".',
    debug_unlock_achievement_ok: 'Unlocked achievement: {name}',
    debug_unlock_achievement_all: 'Unlocked every achievement.',
    debug_unknown_command: 'Unknown command: "{raw}". Type "help" for the full command guide.',

    // ---------- NPC Shop ----------
    shop_title: 'NPC Shop',
    shop_sub_buy: 'Gear up for the mines below — prices tick up the deeper the item is meant for.',
    shop_sub_sell: 'Prices vary a little each visit — the shopkeeper never pays full value.',
    shop_tab_buy: 'Buy',
    shop_tab_sell: 'Sell',
    shop_section_pickaxes: 'Pickaxes',
    shop_section_drills: 'Auto Drills',
    shop_drills_desc: 'Mines passively while you play, and keeps working (capped by storage) while you\'re offline. Buying one activates it immediately — check it any time at the Storage building.',
    shop_section_tickets: 'Dungeon Tickets',
    shop_section_potions: 'Consumables',
    shop_section_sell_ore: 'Sell Ore',
    shop_section_sell_equipment: 'Sell Equipment',
    shop_own_best_pickaxe: 'You already own the strongest pickaxe.',
    shop_own_best_drill: 'You already own the strongest Auto Drill.',
    shop_no_ore_to_sell: 'No ore to sell.',
    shop_no_equipment_to_sell: 'No equipment to sell.',
    shop_buy_btn: 'Buy',
    shop_upgrade_btn: 'Upgrade',
    shop_buy_1_btn: 'Buy 1',
    shop_use_btn: 'Use',
    shop_sell_btn: 'Sell',
    shop_sell_all_btn: 'Sell All',
    shop_ticket_name: 'Abandoned Mine Ticket',
    shop_ticket_desc: 'Pre-buy to skip paying at the door ({doorPrice}g there vs {price}g here)',
    shop_potion_name: 'Health Potion',
    shop_potion_desc: 'Restores you to full HP instantly',
    shop_stat_speed_luck: 'Speed {speed}x \u00b7 Luck +{luck}%',
    shop_stat_level_req: ' \u00b7 Requires Lv.{level}',
    shop_stat_drill: '{rate}/hr \u00b7 Cap {cap}',

    // ---------- Storage / Auto Drill ----------
    drill_title: 'Storage',
    drill_none_desc: 'You don\'t own an Auto Drill yet. An Auto Drill mines for you passively while you play, and keeps working \u2014 capped by storage \u2014 while you\'re offline.',
    drill_none_hint: 'Buy one from the NPC Shop\'s Buy tab to activate it here.',
    drill_active_suffix: ' \u2014 Active',
    drill_stat_speed: 'Mining Speed: {speed}x',
    drill_stat_luck: 'Luck: +{luck}%',
    drill_stat_offline: 'Offline Rate: {rate} ore/hour',
    drill_stat_cap: 'Storage Cap: {cap} ore',
    drill_active_desc: 'Mining a slow trickle of ore right now, and will keep going (capped by storage) while you\'re away. Visit the Shop\'s Buy tab any time for a stronger tier.',

    // ---------- Auction House ----------
    auction_title: 'Auction House',
    auction_ready: 'ready to collect',
    auction_hours_left: '{h}h {m}m left',
    auction_time_left: '{m}:{s} left',
    auction_asking: 'Asking {price}g \u00b7 {remaining}',
    auction_wait_hint: 'Come back once the timer\'s up to see if it sold.',
    auction_sold: 'Sold for {price}g!',
    auction_not_sold: 'Didn\'t sell \u2014 nobody met your asking price.',
    auction_collect_btn: 'Collect',
    auction_toast_sold: '+{price}g from the auction',
    auction_toast_returned: 'Item returned to your inventory.',
    auction_no_equipment: 'You have no equipment to list. Forge something first!',
    auction_list_hint: 'List one item at a time. Ask too high and it might not sell \u2014 ask fair and you\'ll usually get a bit more than your asking price.',
    auction_price_placeholder: 'Asking price (g)',
    auction_list_btn: 'List Item',
    auction_toast_invalid_price: 'Enter a valid asking price.',
    auction_toast_listed: 'Listed!',
    auction_value_suffix: 'g value',
    auction_error_toast: 'The auction house ran into a problem and had to close \u2014 please try again.',
    auction_duration_5min: '5 min',
    auction_duration_15min: '15 min',
    auction_duration_1hr: '1 hour',

    // ---------- Blacksmith / Forge ----------
    forge_title: 'Blacksmith',
    forge_sub: 'Bring {min}-{max} ore total to forge a Sword or Armor \u2014 mix any types you like. Your performance in the mini-game decides quality.',
    forge_no_ore: 'You have no ore. Go mine some first!',
    forge_owned: 'owned {count}',
    forge_selected: 'Selected: {total} / {max} ore (need at least {min})',
    forge_type_sword: 'Sword',
    forge_type_armor: 'Armor',
    forge_start_btn: 'Start Forging',
    forge_toast_ore_changed: 'Something changed with your ore \u2014 please try again.',
    forge_close_confirm_title: 'Leave the forge?',
    forge_close_confirm_sub: 'Your ore will be returned to your inventory, but this forging attempt will be lost.',
    forge_keep_forging_btn: 'Keep Forging',
    forge_leave_btn: 'Leave & Return Ore',
    forge_toast_left: 'Left the forge \u2014 your ore was returned.',
    forge_broken_title: 'The forge sputtered out',
    forge_broken_sub: 'Something went wrong mid-forge \u2014 your ore was refunded. Please try again, and check the browser console for details if this keeps happening.',
    forge_stage_heating: 'Heating',
    forge_stage_heating_hint: 'Hold STOKE to raise the temperature. Keep the needle in the gold zone.',
    forge_stoke_btn: 'STOKE',
    forge_stage_hammering: 'Hammering',
    forge_stage_hammering_hint: 'Tap HIT when the marker crosses the highlighted zone. 5 hits.',
    forge_hit_btn: 'HIT',
    forge_hit_count: 'Hit {n} / 5',
    forge_stage_shaping: 'Shaping',
    forge_stage_shaping_hint: 'Tap the matching direction before the timer runs out.',
    forge_shape_count: 'Shape {n} / 5',
    forge_stage_tempering: 'Tempering',
    forge_stage_tempering_hint: 'Tap QUENCH once the gauge falls into the blue zone.',
    forge_quench_btn: 'QUENCH',
    forge_complete_title: 'Forging Complete',
    forge_stat_atk: 'ATK +{value}',
    forge_stat_hp: 'HP +{value}',
    forge_stat_def: 'Defense +{value}',
    forge_quality_line: 'Quality: {value}% ({label})',
    forge_value_line: 'Est. value: {value}g',
    forge_score_breakdown: 'Heat {heat}% \u00b7 Hammer {hammer}% \u00b7 Shape {shape}% \u00b7 Temper {temper}%',
    forge_claim_btn: 'Claim & Forge Another',
    forge_view_inventory_btn: 'View in Inventory',
    forge_toast_level_up: 'Level up! Now level {level}',

    // ---------- Dungeon result ----------
    dungeon_result_retreated: 'Retreated',
    dungeon_result_defeated: 'You Were Defeated',
    dungeon_result_retreat_sub: 'You pulled out of {name} after clearing {floors} floor{plural}.',
    dungeon_result_defeat_sub: 'You fell on floor {nextFloor} of {name} \u2014 {floors} floor{plural} cleared this dive. Your ticket was consumed either way \u2014 that\'s the risk of the dive.',
    dungeon_result_new_record: 'New Record! Deepest floor: {floor}',
    dungeon_result_best: 'Best dive so far: {floor} floors cleared.',
    dungeon_result_bonus_gold: '+{amount}g depth bonus',
    dungeon_result_bonus_xp: '+{amount} xp depth bonus',
    dungeon_result_return_btn: 'Return to Village',

    // ---------- Offline mining summary ----------
    offline_title: 'Welcome back!',
    offline_sub: 'Your Auto Drill kept working while you were away ({time}).',
    offline_no_ore: 'No ore this time',
    offline_capped_note: 'Your drill\'s storage was full — it would have mined more with more capacity.',
    offline_continue_btn: 'Nice',
  },

  id: {
    // Main menu
    menu_title: 'Pixelforge',
    menu_subtitle: 'Tambang kekayaanmu. Tempa legendamu.',
    menu_start: 'Mulai Permainan',
    menu_howto: 'Cara Bermain',
    menu_credits: 'Kredit',
    menu_back: 'Kembali',

    // How to play
    howto_title: 'Cara Bermain',
    howto_body:
      '• Geser joystick di kiri layar untuk bergerak.\n' +
      '• Tahan tombol bulat untuk MENAMBANG bijih, atau ketuk untuk MENYERANG di dungeon.\n' +
      '• Kunjungi Pandai Besi (Blacksmith) untuk menempa pedang dan baju zirah dari bijih.\n' +
      '• Kunjungi Enchanter untuk memperkuat perlengkapanmu dengan Enchant Fragment, dan menaikkan level Skill dengan Training Fragment.\n' +
      '• Buka Inventory untuk memasang senjata, armor, hingga 2 Passive (Tome), dan hingga 2 Skill (Scroll).\n' +
      '• Skill yang terpasang akan muncul sebagai tombol di samping tombol aksi — ketuk untuk mengaktifkan, perhatikan cooldown-nya.\n' +
      '• Masuki dungeon Abandoned Mine untuk melawan monster demi emas, XP, bijih, Tome, Scroll, dan Fragment.\n' +
      '• Atur volume dan bahasa kapan saja lewat Settings (ikon gear, kanan atas).',

    // Credits
    credits_title: 'Kredit',
    credits_body: 'Dibuat oleh Axel — asli London.\n\nTerima kasih sudah memainkan Pixelforge!',

    // Settings
    settings_title: 'Pengaturan',
    settings_audio: 'Audio',
    settings_master_volume: 'Volume Utama',
    settings_music_volume: 'Volume Musik',
    settings_sfx_volume: 'Efek Suara',
    settings_language: 'Bahasa',
    lang_en: 'Inggris',
    lang_id: 'Indonesia',

    // HUD / action
    action_mine: 'TAMBANG',
    action_attack: 'SERANG',

    // Inventory panel
    inv_title: 'Inventory',
    inv_ore: 'Bijih',
    inv_equipment: 'Perlengkapan',
    inv_passives: 'Passive (maks. 2 terpasang)',
    inv_skills: 'Skill (maks. 2 terpasang)',
    inv_oreindex: 'Indeks Bijih',
    inv_hint: 'Jual bijih dan perlengkapan di NPC Shop untuk emas.',
    inv_no_ore: 'Belum ada bijih — mulai menambang!',
    inv_no_equipment: 'Belum ada perlengkapan — kunjungi Pandai Besi.',
    inv_no_passives: 'Belum ada Tome — kalahkan musuh di dungeon untuk kesempatan mendapatkannya.',
    inv_no_skills: 'Belum ada Skill Scroll — kalahkan musuh di dungeon untuk kesempatan mendapatkannya.',
    equip: 'Pasang',
    unequip: 'Lepas',
    equipped_suffix: ' (terpasang)',
    ore_index_discovered_count: '{count} / {total} ditemukan',
    ore_index_undiscovered: '??? Belum Ditemukan',
    fragments_enchant: 'Enchant Fragment',
    fragments_training: 'Training Fragment',
    skill_level: 'Level',

    // Enchanter NPC
    enchant_title: 'Enchanter',
    enchant_sub: 'Perkuat perlengkapan yang terpasang dengan Enchant Fragment, atau naikkan level Skill Scroll dengan Training Fragment.',
    enchant_tab_gear: 'Enchant Perlengkapan',
    enchant_tab_skills: 'Upgrade Skill',
    enchant_no_sword: 'Belum ada pedang yang terpasang.',
    enchant_no_armor: 'Belum ada armor yang terpasang.',
    enchant_max_level: 'Level enchant sudah maksimal',
    enchant_btn: 'Enchant',
    enchant_cost: 'Biaya',
    enchant_success_toast: '{name} berhasil di-enchant ke level {level}!',
    enchant_fail_toast: 'Enchant Fragment tidak cukup.',
    skill_upgrade_btn: 'Upgrade',
    skill_upgrade_max: 'Level maksimal',
    skill_upgrade_success_toast: '{name} naik ke level {level}!',
    skill_upgrade_fail_toast: 'Training Fragment tidak cukup.',

    // Toasts / prompts (dynamic, engine.js)
    prompt_mine_enter: 'Ketuk TAMBANG untuk masuk ke area tambang',
    prompt_blacksmith: 'Ketuk TAMBANG untuk membuka Forge',
    prompt_shop: 'Ketuk TAMBANG untuk membuka Shop',
    prompt_enchanter: 'Ketuk TAMBANG untuk membuka Enchanter',
    prompt_auction: 'Ketuk TAMBANG untuk membuka Auction House',
    prompt_storage: 'Ketuk TAMBANG untuk membuka Storage',
    prompt_dungeon_ticket: 'Ketuk TAMBANG untuk masuk Abandoned Mine (pakai 1 Ticket — punya {count})',
    prompt_dungeon_gold: 'Ketuk TAMBANG untuk masuk Abandoned Mine ({cost}g)',
    prompt_exit_village: 'Ketuk TAMBANG untuk keluar ke Village',
    prompt_exit_floor: 'Ketuk TAMBANG untuk keluar ke {name}',
    prompt_enter_floor: 'Ketuk TAMBANG untuk masuk ke {name}',
    prompt_level_req: 'Butuh Level {level} (level kamu saat ini {current})',
    prompt_mine_hold: 'Tahan TAMBANG untuk menambang {ore}',
    prompt_retreat: 'Ketuk SERANG untuk mundur ke Village',
    toast_level_req: '{name} butuh Level {level}',
    toast_used_ticket: 'Menggunakan 1 Dungeon Ticket',
    toast_need_gold: 'Butuh {cost}g untuk tiket dungeon',
    toast_no_ore: 'Tidak dapat bijih kali ini... (peluang {chance}%)',
    toast_level_up: 'Naik level! Sekarang Lv.{level}',
    toast_floor_cleared: 'Lantai {floor} berhasil dibersihkan! Turun ke lantai {next}...',
    toast_passive_found: 'Ditemukan: {name} ({quality})',
    toast_skill_found: 'Ditemukan: {name} ({quality})',
    toast_skill_ready: '{name} sudah siap!',
    toast_skill_cooldown: '{name} masih cooldown',
    toast_max_passives: 'Maksimal {max} Passive yang bisa terpasang sekaligus',
    toast_max_skills: 'Maksimal {max} Skill yang bisa terpasang sekaligus',

    common_close: 'Tutup',
    common_back: 'Kembali',
    common_done: 'Selesai',

    // How to Play — direstrukturisasi jadi daftar berikon (lihat index.html)
    howto_step_move: 'Geser joystick di kiri layar untuk menggerakkan karaktermu di peta.',
    howto_step_mine: 'Tahan tombol bulat untuk MENAMBANG bijih, atau ketuk untuk MENYERANG saat berada di dungeon.',
    howto_step_forge: 'Kunjungi Pandai Besi untuk menempa pedang dan baju zirah dari bijih yang kamu tambang.',
    howto_step_enchant: 'Kunjungi Enchanter untuk memperkuat perlengkapan dengan Enchant Fragment, dan menaikkan level Skill dengan Training Fragment.',
    howto_step_inventory: 'Buka Inventory untuk memasang senjata, armor, hingga 2 Passive (Tome), dan hingga 2 Skill (Scroll).',
    howto_step_skills: 'Skill yang terpasang akan muncul sebagai tombol di samping tombol aksi — ketuk untuk mengaktifkan, perhatikan cooldown-nya.',
    howto_step_dungeon: 'Masuki dungeon Abandoned Mine untuk melawan monster demi emas, XP, bijih, Tome, Scroll, dan Fragment.',
    howto_step_progress: 'Pantau Achievement dan Quest kapan saja lewat tombol trofi di kanan atas.',
    howto_step_settings: 'Atur volume dan bahasa kapan saja lewat Settings (ikon gear, kanan atas).',

    // Modal nama pengguna
    username_title: 'Selamat Datang di Pixelforge',
    username_sub: 'Pilih nama — pemain lain di desa akan melihat namamu, bukan "Player".',
    username_placeholder: 'Namamu',
    username_confirm: 'Masuk ke Desa',
    username_error_short: 'Nama harus minimal 2 karakter.',

    // Chrome statis konsol debug (index.html)
    debug_console_title: 'Debug Console',
    debug_input_placeholder: 'add money(500)',
    debug_run: 'Jalankan',

    // ---------- Achievement ----------
    achievements_title: 'Achievement',
    achievements_sub: 'Pencapaian yang otomatis tercatat saat kamu bermain — tidak perlu diklaim.',
    achievements_progress: '{unlocked} / {total} terbuka',
    achievements_locked_label: 'Terkunci',
    achievements_unlocked_label: 'Terbuka',
    achievements_reward_label: 'Hadiah',
    achievements_reward_debug: 'Membuka Debug Mode',
    toast_achievement_unlocked: 'Achievement terbuka: {name}!',
    toast_debug_unlocked: 'Debug Mode terbuka! Cari tab DEBUG di kanan atas.',

    ach_first_ore_name: 'Bijih Pertama',
    ach_first_ore_desc: 'Temukan bijih pertamamu.',
    ach_armed_name: 'Siap Bertarung',
    ach_armed_desc: 'Tempa atau miliki satu perlengkapan.',
    ach_level_5_name: 'Langkah Pertama',
    ach_level_5_desc: 'Capai Level karakter 5.',
    ach_level_25_name: 'Penambang Berpengalaman',
    ach_level_25_desc: 'Capai Level karakter 25.',
    ach_level_50_name: 'Penambang Veteran',
    ach_level_50_desc: 'Capai Level karakter 50.',
    ach_level_80_name: 'Penambang Legendaris',
    ach_level_80_desc: 'Capai Level karakter 80.',
    ach_dive_10_name: 'Penjelajah Dungeon',
    ach_dive_10_desc: 'Bersihkan lantai 10 Abandoned Mine.',
    ach_dive_50_name: 'Penakluk Dungeon',
    ach_dive_50_desc: 'Bersihkan lantai 50 Abandoned Mine.',
    ach_ore_collector_name: 'Kolektor Bijih',
    ach_ore_collector_desc: 'Temukan 15 jenis bijih berbeda.',
    ach_enchant_apprentice_name: 'Murid Enchanter',
    ach_enchant_apprentice_desc: 'Enchant satu perlengkapan untuk pertama kalinya.',
    ach_enchant_empowered_name: 'Diperkuat',
    ach_enchant_empowered_desc: 'Enchant satu perlengkapan hingga +5.',
    ach_skilled_name: 'Petualang Terampil',
    ach_skilled_desc: 'Miliki satu Skill yang terpasang.',
    ach_end_name: 'Akhir dari Segalanya',
    ach_end_desc: 'Capai Level 120 dan bersihkan lantai 100 Abandoned Mine.',

    // ---------- Quest ----------
    quests_title: 'Quest',
    quests_sub: 'Selesaikan objektif untuk mengklaim hadiah satu kali.',
    quests_progress: '{done} / {total} selesai',
    quest_claim: 'Klaim',
    quest_claimed: 'Terklaim',
    quest_locked: 'Berlangsung',
    toast_quest_claimed: 'Hadiah quest diklaim: {name}!',

    quest_gold_100_name: 'Tabungan Awal',
    quest_gold_100_desc: 'Miliki 100 emas sekaligus.',
    quest_ore_50_name: 'Kolektor Bijih',
    quest_ore_50_desc: 'Miliki total 50 bijih sekaligus.',
    quest_forge_1_name: 'Ciptaan Pertama',
    quest_forge_1_desc: 'Miliki setidaknya 1 perlengkapan.',
    quest_level_10_name: 'Mulai Menanjak',
    quest_level_10_desc: 'Capai Level karakter 10.',
    quest_dive_5_name: 'Masuk Lebih Dalam',
    quest_dive_5_desc: 'Bersihkan lantai 5 Abandoned Mine.',
    quest_equip_skill_name: 'Siap Bertarung',
    quest_equip_skill_desc: 'Pasang satu Skill (Scroll).',
    quest_equip_passive_name: 'Pertumbuhan Stabil',
    quest_equip_passive_desc: 'Pasang satu Passive (Tome).',
    quest_dive_20_name: 'Penyelam Ulung',
    quest_dive_20_desc: 'Bersihkan lantai 20 Abandoned Mine.',
    quest_level_50_name: 'Setengah Perjalanan',
    quest_level_50_desc: 'Capai Level karakter 50.',
    quest_enchant_3_name: 'Disempurnakan',
    quest_enchant_3_desc: 'Enchant satu perlengkapan hingga +3.',

    reward_gold: '{amount}g',
    reward_dungeon_ticket: '{amount}x Dungeon Ticket',
    reward_enchant_fragments: '{amount}x Enchant Fragment',
    reward_training_fragments: '{amount}x Training Fragment',
    reward_ore: '{amount}x {name}',
    reward_ore_random: '{amount}x Bijih Acak',
    reward_skill_random: '1x Skill (Scroll) Acak',
    reward_tome_random: '1x Passive (Tome) Acak',

    // ---------- Progress (Achievement + Quest) tombol/modal HUD ----------
    progress_tab_achievements: 'Achievement',
    progress_tab_quests: 'Quest',
    progress_tab_daily: 'Harian',
    progress_tab_weekly: 'Mingguan',

    // ---------- Quest Harian ----------
    daily_quests_title: 'Quest Harian',
    daily_quests_sub: 'Reset setiap hari. 3 objektif aktif sekaligus.',
    daily_mine_30_name: 'Penambang Harian',
    daily_mine_30_desc: 'Tambang 30 bijih hari ini.',
    daily_mine_60_name: 'Shift Mendalam',
    daily_mine_60_desc: 'Tambang 60 bijih hari ini.',
    daily_gold_150_name: 'Cuan Cepat',
    daily_gold_150_desc: 'Dapatkan 150 emas hari ini.',
    daily_kill_8_name: 'Bersih-bersih Musuh',
    daily_kill_8_desc: 'Kalahkan 8 musuh hari ini.',
    daily_dive_1_name: 'Penyelaman Hari Ini',
    daily_dive_1_desc: 'Selesaikan 1 run Abandoned Mine hari ini.',
    daily_enchant_1_name: 'Upgrade Harian',
    daily_enchant_1_desc: 'Enchant satu perlengkapan hari ini.',

    // ---------- Quest Mingguan ----------
    weekly_quests_title: 'Quest Mingguan',
    weekly_quests_sub: 'Reset setiap minggu. 3 objektif aktif sekaligus.',
    weekly_mine_300_name: 'Penggalian Mingguan',
    weekly_mine_300_desc: 'Tambang 300 bijih minggu ini.',
    weekly_mine_600_name: 'Maraton Bijih',
    weekly_mine_600_desc: 'Tambang 600 bijih minggu ini.',
    weekly_gold_1000_name: 'Pundi-pundi Besar',
    weekly_gold_1000_desc: 'Dapatkan 1000 emas minggu ini.',
    weekly_kill_40_name: 'Pembersihan Monster',
    weekly_kill_40_desc: 'Kalahkan 40 musuh minggu ini.',
    weekly_dive_5_name: 'Penyelaman Mingguan',
    weekly_dive_5_desc: 'Selesaikan 5 run Abandoned Mine minggu ini.',
    weekly_enchant_3_name: 'Disiplin Sang Pandai Besi',
    weekly_enchant_3_desc: 'Enchant perlengkapan 3 kali minggu ini.',

    // ---------- Debug Mode ----------
    debug_active_msg: 'Debug Mode aktif — tidak perlu progres. Ketik perintah di bawah, atau ketik "help" untuk panduan lengkap.',
    debug_help_title: '=== Pixelforge Debug Console — Panduan Perintah ===',
    debug_help_money: 'add money (nominal)              Menambah emas. cth: add money(500)',
    debug_help_level: 'add level (level)                Menambah/mengurangi level karakter. cth: add level(5)',
    debug_help_setfloor: 'setfloor (lantai)                Memindahkan dive Abandoned Mine saat ini ke lantai tertentu. cth: setfloor(50)',
    debug_help_enchant_token: 'add enchant token (jumlah)       Menambah Enchant Fragment. cth: add enchant token(10)',
    debug_help_training_token: 'add training token (jumlah)      Menambah Training Fragment. cth: add training token(10)',
    debug_help_get_item: 'get item (id) (qty) [quality]    Memberi ore/pickaxe/passive/skill sesuai id. cth: get item(iron,10)',
    debug_help_list_item: 'list item                        Menampilkan semua id item yang bisa didapat.',
    debug_help_list_achievements: 'list achievement                 Menampilkan semua id achievement beserta statusnya.',
    debug_help_list_quests: 'list quest                       Menampilkan semua id quest beserta statusnya.',
    debug_help_unlock_achievement: 'unlock achievement (id)          Paksa buka satu achievement sesuai id (atau "all").',
    debug_help_help: 'help / list command              Menampilkan panduan ini lagi.',
    debug_setfloor_usage: 'Penggunaan: setfloor (nomor lantai)',
    debug_setfloor_ok: 'Berpindah ke lantai {floor}.',
    debug_enchant_token_usage: 'Penggunaan: add enchant token (jumlah)',
    debug_enchant_token_ok: '+{amount} Enchant Fragment. Total: {total}',
    debug_training_token_usage: 'Penggunaan: add training token (jumlah)',
    debug_training_token_ok: '+{amount} Training Fragment. Total: {total}',
    debug_unlock_achievement_usage: 'Penggunaan: unlock achievement (id) — coba "list achievement" untuk melihat id, atau "all"',
    debug_unlock_achievement_unknown: 'Id achievement "{id}" tidak dikenal. Coba "list achievement".',
    debug_unlock_achievement_ok: 'Achievement terbuka: {name}',
    debug_unlock_achievement_all: 'Semua achievement telah dibuka.',
    debug_unknown_command: 'Perintah tidak dikenal: "{raw}". Ketik "help" untuk panduan lengkap.',

    // ---------- NPC Shop ----------
    shop_title: 'NPC Shop',
    shop_sub_buy: 'Persiapkan diri untuk tambang di bawah \u2014 harga naik semakin dalam area tujuan barangnya.',
    shop_sub_sell: 'Harga sedikit berubah tiap kunjungan \u2014 pedagang tidak pernah membayar nilai penuh.',
    shop_tab_buy: 'Beli',
    shop_tab_sell: 'Jual',
    shop_section_pickaxes: 'Pickaxe',
    shop_section_drills: 'Auto Drill',
    shop_drills_desc: 'Menambang secara pasif saat kamu bermain, dan tetap bekerja (dibatasi kapasitas storage) saat kamu offline. Membeli satu langsung mengaktifkannya \u2014 cek kapan saja di gedung Storage.',
    shop_section_tickets: 'Dungeon Ticket',
    shop_section_potions: 'Consumable',
    shop_section_sell_ore: 'Jual Bijih',
    shop_section_sell_equipment: 'Jual Perlengkapan',
    shop_own_best_pickaxe: 'Kamu sudah memiliki pickaxe terkuat.',
    shop_own_best_drill: 'Kamu sudah memiliki Auto Drill terkuat.',
    shop_no_ore_to_sell: 'Tidak ada bijih untuk dijual.',
    shop_no_equipment_to_sell: 'Tidak ada perlengkapan untuk dijual.',
    shop_buy_btn: 'Beli',
    shop_upgrade_btn: 'Upgrade',
    shop_buy_1_btn: 'Beli 1',
    shop_use_btn: 'Gunakan',
    shop_sell_btn: 'Jual',
    shop_sell_all_btn: 'Jual Semua',
    shop_ticket_name: 'Tiket Abandoned Mine',
    shop_ticket_desc: 'Beli di muka agar tak perlu bayar di pintu ({doorPrice}g di sana vs {price}g di sini)',
    shop_potion_name: 'Health Potion',
    shop_potion_desc: 'Memulihkan HP-mu sampai penuh secara instan',
    shop_stat_speed_luck: 'Speed {speed}x \u00b7 Luck +{luck}%',
    shop_stat_level_req: ' \u00b7 Butuh Lv.{level}',
    shop_stat_drill: '{rate}/jam \u00b7 Cap {cap}',

    // ---------- Storage / Auto Drill ----------
    drill_title: 'Storage',
    drill_none_desc: 'Kamu belum memiliki Auto Drill. Auto Drill menambang secara pasif saat kamu bermain, dan tetap bekerja \u2014 dibatasi kapasitas storage \u2014 saat kamu offline.',
    drill_none_hint: 'Beli satu dari tab Beli di NPC Shop untuk mengaktifkannya di sini.',
    drill_active_suffix: ' \u2014 Aktif',
    drill_stat_speed: 'Mining Speed: {speed}x',
    drill_stat_luck: 'Luck: +{luck}%',
    drill_stat_offline: 'Offline Rate: {rate} bijih/jam',
    drill_stat_cap: 'Storage Cap: {cap} bijih',
    drill_active_desc: 'Sedang menambang perlahan sekarang, dan akan terus berjalan (dibatasi storage) saat kamu pergi. Kunjungi tab Beli di Shop kapan saja untuk tier yang lebih kuat.',

    // ---------- Auction House ----------
    auction_title: 'Auction House',
    auction_ready: 'siap diambil',
    auction_hours_left: 'sisa {h}j {m}m',
    auction_time_left: 'sisa {m}:{s}',
    auction_asking: 'Harga minta {price}g \u00b7 {remaining}',
    auction_wait_hint: 'Kembali lagi setelah waktunya habis untuk melihat apakah terjual.',
    auction_sold: 'Terjual seharga {price}g!',
    auction_not_sold: 'Tidak terjual \u2014 tidak ada yang memenuhi harga minta.',
    auction_collect_btn: 'Ambil',
    auction_toast_sold: '+{price}g dari lelang',
    auction_toast_returned: 'Barang dikembalikan ke inventory-mu.',
    auction_no_equipment: 'Kamu tidak punya perlengkapan untuk dilelang. Tempa sesuatu dulu!',
    auction_list_hint: 'Lelang satu barang dalam satu waktu. Harga terlalu tinggi bisa tidak laku \u2014 harga wajar biasanya menghasilkan sedikit lebih dari harga minta.',
    auction_price_placeholder: 'Harga minta (g)',
    auction_list_btn: 'Lelang Barang',
    auction_toast_invalid_price: 'Masukkan harga minta yang valid.',
    auction_toast_listed: 'Berhasil dilelang!',
    auction_value_suffix: 'g nilai',
    auction_error_toast: 'Auction House mengalami masalah dan harus ditutup \u2014 silakan coba lagi.',
    auction_duration_5min: '5 menit',
    auction_duration_15min: '15 menit',
    auction_duration_1hr: '1 jam',

    // ---------- Pandai Besi / Forge ----------
    forge_title: 'Pandai Besi',
    forge_sub: 'Bawa {min}-{max} bijih total untuk menempa Sword atau Armor \u2014 campur jenis apa saja. Performamu di mini-game menentukan kualitasnya.',
    forge_no_ore: 'Kamu belum punya bijih. Tambang dulu!',
    forge_owned: 'punya {count}',
    forge_selected: 'Terpilih: {total} / {max} bijih (minimal {min})',
    forge_type_sword: 'Sword',
    forge_type_armor: 'Armor',
    forge_start_btn: 'Mulai Menempa',
    forge_toast_ore_changed: 'Ada perubahan pada bijihmu \u2014 silakan coba lagi.',
    forge_close_confirm_title: 'Tinggalkan forge?',
    forge_close_confirm_sub: 'Bijihmu akan dikembalikan ke inventory, tapi proses tempa ini akan hilang.',
    forge_keep_forging_btn: 'Lanjutkan Menempa',
    forge_leave_btn: 'Tinggalkan & Kembalikan Bijih',
    forge_toast_left: 'Meninggalkan forge \u2014 bijihmu dikembalikan.',
    forge_broken_title: 'Forge tiba-tiba padam',
    forge_broken_sub: 'Ada yang salah di tengah proses tempa \u2014 bijihmu dikembalikan. Silakan coba lagi, dan cek console browser jika ini terus terjadi.',
    forge_stage_heating: 'Pemanasan',
    forge_stage_heating_hint: 'Tahan STOKE untuk menaikkan suhu. Jaga jarum tetap di zona emas.',
    forge_stoke_btn: 'STOKE',
    forge_stage_hammering: 'Penempaan',
    forge_stage_hammering_hint: 'Ketuk HIT saat penanda melewati zona yang disorot. 5 pukulan.',
    forge_hit_btn: 'HIT',
    forge_hit_count: 'Pukulan {n} / 5',
    forge_stage_shaping: 'Pembentukan',
    forge_stage_shaping_hint: 'Ketuk arah yang sesuai sebelum waktu habis.',
    forge_shape_count: 'Bentuk {n} / 5',
    forge_stage_tempering: 'Pendinginan',
    forge_stage_tempering_hint: 'Ketuk QUENCH saat gauge jatuh ke zona biru.',
    forge_quench_btn: 'QUENCH',
    forge_complete_title: 'Penempaan Selesai',
    forge_stat_atk: 'ATK +{value}',
    forge_stat_hp: 'HP +{value}',
    forge_stat_def: 'Defense +{value}',
    forge_quality_line: 'Kualitas: {value}% ({label})',
    forge_value_line: 'Perkiraan nilai: {value}g',
    forge_score_breakdown: 'Heat {heat}% \u00b7 Hammer {hammer}% \u00b7 Shape {shape}% \u00b7 Temper {temper}%',
    forge_claim_btn: 'Klaim & Tempa Lagi',
    forge_view_inventory_btn: 'Lihat di Inventory',
    forge_toast_level_up: 'Naik level! Sekarang level {level}',

    // ---------- Hasil dungeon ----------
    dungeon_result_retreated: 'Mundur',
    dungeon_result_defeated: 'Kamu Kalah',
    dungeon_result_retreat_sub: 'Kamu mundur dari {name} setelah membersihkan {floors} lantai.',
    dungeon_result_defeat_sub: 'Kamu tumbang di lantai {nextFloor} dari {name} \u2014 {floors} lantai berhasil dibersihkan dive ini. Tiketmu tetap terpakai \u2014 itu risiko dive.',
    dungeon_result_new_record: 'Rekor Baru! Lantai terdalam: {floor}',
    dungeon_result_best: 'Dive terbaik sejauh ini: {floor} lantai dibersihkan.',
    dungeon_result_bonus_gold: '+{amount}g bonus kedalaman',
    dungeon_result_bonus_xp: '+{amount} xp bonus kedalaman',
    dungeon_result_return_btn: 'Kembali ke Desa',

    // ---------- Ringkasan tambang offline ----------
    offline_title: 'Selamat datang kembali!',
    offline_sub: 'Auto Drill-mu tetap bekerja selama kamu pergi ({time}).',
    offline_no_ore: 'Tidak dapat bijih kali ini',
    offline_capped_note: 'Storage drill-mu penuh — sebenarnya bisa menambang lebih banyak dengan kapasitas lebih besar.',
    offline_continue_btn: 'Oke',
  },
};

let currentLang = 'en';
const listeners = new Set();

export function initLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && STRINGS[saved]) currentLang = saved;
  } catch {
    // storage unavailable — default 'en' stands
  }
  return currentLang;
}

export function getLanguage() { return currentLang; }

export function setLanguage(lang) {
  if (!STRINGS[lang] || lang === currentLang) return;
  currentLang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  for (const fn of listeners) fn(lang);
}

export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function t(key, vars) {
  const dict = STRINGS[currentLang] || STRINGS.en;
  let str = dict[key] ?? STRINGS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) str = str.split(`{${k}}`).join(v);
  }
  return str;
}

// Applies t() to every element under `root` carrying data-i18n /
// data-i18n-placeholder, so static HTML chrome (menu, settings, modal
// titles) can be retranslated in one call whenever the language changes.
export function applyStaticTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}
