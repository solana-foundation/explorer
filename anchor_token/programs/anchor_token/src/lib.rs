use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Burn};
use mpl_token_metadata::instruction::create_metadata_accounts_v3;
use mpl_token_metadata::state::{CollectionDetails, Creator, DataV2};

declare_id!("Anchor111111111111111111111111111111111111111");

#[program]
pub mod anchor_token {
    use super::*;

    pub fn create_token(
        ctx: Context<CreateToken>,
        name: String,
        symbol: String,
        uri: String,
        seller_fee_basis_points: u16,
        decimals: u8,
        amount: u64,
    ) -> Result<()> {
        let metadata_account = &ctx.accounts.metadata;
        let mint = &ctx.accounts.mint;
        let payer = &ctx.accounts.payer;

        let (expected_metadata, _bump) = Pubkey::find_program_address(
            &[
                b"metadata",
                mpl_token_metadata::ID.as_ref(),
                mint.key().as_ref(),
            ],
            &mpl_token_metadata::ID,
        );
        require_keys_eq!(metadata_account.key(), expected_metadata);

        let cpi_accounts = MintTo {
            mint: mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: payer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, amount)?;

        let creators = vec![Creator {
            address: payer.key(),
            verified: true,
            share: 100,
        }];

        let metadata_data = DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points,
            creators: Some(creators),
            collection: None,
            uses: None,
        };

        let metadata_ix = create_metadata_accounts_v3(
            ctx.accounts.token_metadata_program.key(),
            metadata_account.key(),
            mint.key(),
            payer.key(),
            payer.key(),
            payer.key(),
            metadata_data,
            true,
            None,
        );

        anchor_lang::solana_program::program::invoke(
            &metadata_ix,
            &[
                metadata_account.to_account_info(),
                mint.to_account_info(),
                payer.to_account_info(),
                payer.to_account_info(),
                payer.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
                ctx.accounts.token_metadata_program.to_account_info(),
            ],
        )?;

        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.source_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = decimals,
        mint::authority = payer,
        mint::freeze_authority = payer,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: PDA account derived from the mint and the Metaplex Token Metadata program.
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: The account that will receive the token balance.
    pub recipient: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Metaplex Token Metadata program.
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(init_if_needed, payer = payer, associated_token::mint = mint, associated_token::authority = recipient)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: The recipient for the minted tokens.
    pub recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut, has_one = authority)]
    pub source_token_account: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}
