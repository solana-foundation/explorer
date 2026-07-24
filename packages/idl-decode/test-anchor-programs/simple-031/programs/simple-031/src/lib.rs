use anchor_lang::prelude::*;

declare_id!("391y4fKGKUEt7n6HuKrkfGYLdkvnk6rvneR7snKe6wzy");

#[program]
pub mod simple_031 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.authority = ctx.accounts.payer.key();
        counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>, amount: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_add(amount).ok_or(SimpleError::Overflow)?;
        emit!(CounterIncremented { count: counter.count });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + Counter::INIT_SPACE)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = authority)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub authority: Pubkey,
    pub count: u64,
}

#[error_code]
pub enum SimpleError {
    #[msg("Counter overflow")]
    Overflow,
}

#[event]
pub struct CounterIncremented {
    pub count: u64,
}
