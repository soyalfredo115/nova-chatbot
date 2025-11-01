from alembic import op
import sqlalchemy as sa

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('created_at', sa.String(), nullable=False),
    )
    op.create_table(
        'refresh_token',
        sa.Column('token', sa.String(), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, index=True),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.Column('expires_at', sa.String(), nullable=False),
    )
    op.create_table(
        'comments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('author_name', sa.String(), nullable=False),
        sa.Column('user_email', sa.String(), nullable=False, index=True),
        sa.Column('text', sa.String(), nullable=False),
        sa.Column('created_at', sa.String(), nullable=False),
    )
    op.create_table(
        'subscribers',
        sa.Column('email', sa.String(), primary_key=True),
        sa.Column('created_at', sa.String(), nullable=False),
    )
    op.create_table(
        'contacts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('created_at', sa.String(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('contacts')
    op.drop_table('subscribers')
    op.drop_table('comments')
    op.drop_table('refresh_token')
    op.drop_table('users')

