use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

declare_id!("DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB");

pub const CREATURE_SEED: &[u8] = b"creature";
pub const MAX_NAME_LENGTH: usize = 32;

pub const SPECIES_WISP: u8 = 0;
pub const SPECIES_BYTEBEAST: u8 = 1;
pub const SPECIES_MOSSLING: u8 = 2;

pub const RITUAL_BOND: u8 = 1;
pub const RITUAL_EXPLORE: u8 = 2;

pub const EVOLUTION_CHOICE_A: u8 = 1;
pub const EVOLUTION_CHOICE_B: u8 = 2;

pub const EVOLUTION_REQUIRED_LEVEL: u8 = 3;
pub const EVOLUTION_REQUIRED_XP: u32 = 100;

#[program]
pub mod chainkin {
    use super::*;

    pub fn initialize_creature(
        ctx: Context<InitializeCreature>,
        species_id: u8,
        name: String,
    ) -> Result<()> {
        require!(species_id <= SPECIES_MOSSLING, ChainkinError::InvalidSpecies);
        require!(!name.is_empty(), ChainkinError::NameEmpty);
        require!(name.len() <= MAX_NAME_LENGTH, ChainkinError::NameTooLong);

        let creature = &mut ctx.accounts.creature;
        let owner = ctx.accounts.owner.key();
        let clock = Clock::get()?;

        // Deterministic creature identifier derived from owner + species + slot
        let id_hash = hash(&[owner.as_ref(), &[species_id], &clock.slot.to_le_bytes()].concat());
        let mut creature_id = [0u8; 16];
        creature_id.copy_from_slice(&id_hash.to_bytes()[..16]);

        creature.owner = owner;
        creature.creature_id = creature_id;
        creature.species_id = species_id;
        creature.name = name;
        creature.level = 1;
        creature.xp = 0;
        creature.traits = get_base_traits(species_id);
        creature.ritual_count = 0;
        creature.evolution_stage = 0;
        creature.evolution_choice = 0;
        creature.last_action_slot = clock.slot;
        creature.bump = ctx.bumps.creature;

        msg!(
            "Chainkin hatched: owner={}, species={}, id={:?}",
            owner,
            species_id,
            creature_id
        );
        Ok(())
    }

    pub fn perform_ritual(ctx: Context<PerformRitual>, ritual_id: u8) -> Result<()> {
        let creature = &mut ctx.accounts.creature;
        let clock = Clock::get()?;

        match ritual_id {
            RITUAL_BOND => {
                // Bond: +30 XP, +2 curiosity, +3 empathy
                creature.xp = creature.xp.saturating_add(30);
                creature.traits[0] = creature.traits[0].saturating_add(2); // curiosity
                creature.traits[2] = creature.traits[2].saturating_add(3); // empathy
            }
            RITUAL_EXPLORE => {
                // Explore: +40 XP, +3 courage, +2 ingenuity
                creature.xp = creature.xp.saturating_add(40);
                creature.traits[1] = creature.traits[1].saturating_add(3); // courage
                creature.traits[3] = creature.traits[3].saturating_add(2); // ingenuity
            }
            _ => return err!(ChainkinError::InvalidRitual),
        }

        // Recalculate deterministic level
        creature.level = calculate_level(creature.xp);
        creature.ritual_count = creature.ritual_count.saturating_add(1);
        creature.last_action_slot = clock.slot;

        msg!(
            "Ritual {} performed: xp={}, level={}, rituals={}",
            ritual_id,
            creature.xp,
            creature.level,
            creature.ritual_count
        );
        Ok(())
    }

    pub fn evolve(ctx: Context<Evolve>, evolution_choice: u8) -> Result<()> {
        let creature = &mut ctx.accounts.creature;
        let clock = Clock::get()?;

        require!(creature.evolution_stage == 0, ChainkinError::AlreadyEvolved);
        require!(
            creature.level >= EVOLUTION_REQUIRED_LEVEL || creature.xp >= EVOLUTION_REQUIRED_XP,
            ChainkinError::NotEligibleForEvolution
        );
        require!(
            evolution_choice == EVOLUTION_CHOICE_A || evolution_choice == EVOLUTION_CHOICE_B,
            ChainkinError::InvalidEvolutionChoice
        );

        creature.evolution_stage = 1;
        creature.evolution_choice = evolution_choice;

        // Apply bonus traits based on choice
        let bonus = get_evolution_bonus(creature.species_id, evolution_choice);
        for i in 0..4 {
            creature.traits[i] = creature.traits[i].saturating_add(bonus[i]);
        }
        creature.last_action_slot = clock.slot;

        msg!(
            "Chainkin evolved: species={}, choice={}",
            creature.species_id,
            evolution_choice
        );
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(species_id: u8, name: String)]
pub struct InitializeCreature<'info> {
    #[account(
        init,
        payer = owner,
        space = Creature::SPACE,
        seeds = [CREATURE_SEED, owner.key().as_ref()],
        bump
    )]
    pub creature: Account<'info, Creature>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PerformRitual<'info> {
    #[account(
        mut,
        seeds = [CREATURE_SEED, owner.key().as_ref()],
        bump = creature.bump,
        has_one = owner @ ChainkinError::Unauthorized
    )]
    pub creature: Account<'info, Creature>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct Evolve<'info> {
    #[account(
        mut,
        seeds = [CREATURE_SEED, owner.key().as_ref()],
        bump = creature.bump,
        has_one = owner @ ChainkinError::Unauthorized
    )]
    pub creature: Account<'info, Creature>,

    pub owner: Signer<'info>,
}

#[account]
pub struct Creature {
    pub owner: Pubkey,               // 32
    pub creature_id: [u8; 16],        // 16
    pub species_id: u8,               // 1
    pub name: String,                 // 4 + 32
    pub level: u8,                    // 1
    pub xp: u32,                      // 4
    pub traits: [u8; 4],              // 4 (curiosity, courage, empathy, ingenuity)
    pub ritual_count: u16,            // 2
    pub evolution_stage: u8,          // 1
    pub evolution_choice: u8,         // 1
    pub last_action_slot: u64,        // 8
    pub bump: u8,                     // 1
}

impl Creature {
    pub const SPACE: usize = 8  // discriminator
        + 32                    // owner
        + 16                    // creature_id
        + 1                     // species_id
        + 4 + MAX_NAME_LENGTH   // name
        + 1                     // level
        + 4                     // xp
        + 4                     // traits
        + 2                     // ritual_count
        + 1                     // evolution_stage
        + 1                     // evolution_choice
        + 8                     // last_action_slot
        + 1;                    // bump
}

pub fn get_base_traits(species_id: u8) -> [u8; 4] {
    match species_id {
        SPECIES_WISP => [12, 6, 10, 8],
        SPECIES_BYTEBEAST => [8, 12, 6, 10],
        SPECIES_MOSSLING => [7, 8, 13, 8],
        _ => [5, 5, 5, 5],
    }
}

pub fn get_evolution_bonus(species_id: u8, choice: u8) -> [u8; 4] {
    match (species_id, choice) {
        (SPECIES_WISP, 1) => [5, 2, 8, 3],      // Astral Guide
        (SPECIES_WISP, 2) => [7, 4, 3, 6],      // Chrono Phantom
        (SPECIES_BYTEBEAST, 1) => [2, 9, 3, 6],  // Cyber Warden
        (SPECIES_BYTEBEAST, 2) => [6, 7, 2, 9],  // Spark Overdrive
        (SPECIES_MOSSLING, 1) => [3, 6, 10, 3],  // Elder Arbor
        (SPECIES_MOSSLING, 2) => [6, 4, 8, 6],   // Bloom Weaver
        _ => [3, 3, 3, 3],
    }
}

pub fn calculate_level(xp: u32) -> u8 {
    if xp >= 3200 {
        15
    } else if xp >= 2600 {
        14
    } else if xp >= 2100 {
        13
    } else if xp >= 1700 {
        12
    } else if xp >= 1400 {
        11
    } else if xp >= 1150 {
        10
    } else if xp >= 950 {
        9
    } else if xp >= 800 {
        8
    } else if xp >= 650 {
        7
    } else if xp >= 500 {
        6
    } else if xp >= 350 {
        5
    } else if xp >= 200 {
        4
    } else if xp >= 100 {
        3
    } else if xp >= 40 {
        2
    } else {
        1
    }
}

#[error_code]
pub enum ChainkinError {
    #[msg("Invalid species identifier")]
    InvalidSpecies,
    #[msg("Creature name cannot be empty")]
    NameEmpty,
    #[msg("Creature name exceeds 32 characters")]
    NameTooLong,
    #[msg("Invalid ritual identifier")]
    InvalidRitual,
    #[msg("Creature has not reached evolution threshold")]
    NotEligibleForEvolution,
    #[msg("Creature has already evolved")]
    AlreadyEvolved,
    #[msg("Invalid evolution choice for this species")]
    InvalidEvolutionChoice,
    #[msg("Caller is not the creature owner")]
    Unauthorized,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base_traits() {
        assert_eq!(get_base_traits(SPECIES_WISP), [12, 6, 10, 8]);
        assert_eq!(get_base_traits(SPECIES_BYTEBEAST), [8, 12, 6, 10]);
        assert_eq!(get_base_traits(SPECIES_MOSSLING), [7, 8, 13, 8]);
    }

    #[test]
    fn test_level_progression() {
        assert_eq!(calculate_level(0), 1);
        assert_eq!(calculate_level(39), 1);
        assert_eq!(calculate_level(40), 2);
        assert_eq!(calculate_level(99), 2);
        assert_eq!(calculate_level(100), 3);
        assert_eq!(calculate_level(199), 3);
        assert_eq!(calculate_level(200), 4);
        assert_eq!(calculate_level(650), 7);
        assert_eq!(calculate_level(3200), 15);
    }

    #[test]
    fn test_space_calculation() {
        assert_eq!(Creature::SPACE, 8 + 32 + 16 + 1 + 36 + 1 + 4 + 4 + 2 + 1 + 1 + 8 + 1);
    }

    #[test]
    fn test_evolution_bonuses() {
        assert_eq!(get_evolution_bonus(SPECIES_WISP, 1), [5, 2, 8, 3]);
        assert_eq!(get_evolution_bonus(SPECIES_WISP, 2), [7, 4, 3, 6]);
        assert_eq!(get_evolution_bonus(SPECIES_BYTEBEAST, 1), [2, 9, 3, 6]);
        assert_eq!(get_evolution_bonus(SPECIES_BYTEBEAST, 2), [6, 7, 2, 9]);
        assert_eq!(get_evolution_bonus(SPECIES_MOSSLING, 1), [3, 6, 10, 3]);
        assert_eq!(get_evolution_bonus(SPECIES_MOSSLING, 2), [6, 4, 8, 6]);
        assert_eq!(get_evolution_bonus(99, 1), [3, 3, 3, 3]);
    }

    #[test]
    fn test_saturating_arithmetic_invariants() {
        let max_xp: u32 = u32::MAX;
        assert_eq!(max_xp.saturating_add(30), u32::MAX);
        assert_eq!(max_xp.saturating_add(40), u32::MAX);

        let max_trait: u8 = 255;
        assert_eq!(max_trait.saturating_add(2), 255);
        assert_eq!(max_trait.saturating_add(3), 255);
        assert_eq!(max_trait.saturating_add(9), 255);

        let max_rituals: u16 = u16::MAX;
        assert_eq!(max_rituals.saturating_add(1), u16::MAX);
    }

    #[test]
    fn test_evolution_eligibility_thresholds() {
        assert!(calculate_level(EVOLUTION_REQUIRED_XP) >= EVOLUTION_REQUIRED_LEVEL);
        assert_eq!(EVOLUTION_REQUIRED_LEVEL, 3);
        assert_eq!(EVOLUTION_REQUIRED_XP, 100);
        assert_eq!(EVOLUTION_CHOICE_A, 1);
        assert_eq!(EVOLUTION_CHOICE_B, 2);
    }
}
