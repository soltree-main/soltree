import os
from ScoreKeeper import ScoreKeeper

from dotenv import load_dotenv
from discord import Intents, utils
from discord.ext import commands

# Load the environment variables
load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')
GUILD = os.getenv('DISCORD_GUILD')

# Set the members intent
intents = Intents.default()
intents.members = True

# Init bot
bot = commands.Bot(command_prefix='STG-', intents=intents)

@bot.event
async def on_ready():
    guild = utils.get(bot.guilds, name=GUILD)
    
    print(
        f'{bot.user} is connected to the following guild:\n'
        f'{guild.name}(id: {guild.id})\n'
    )

    for channel in guild.channels:
        print(channel)

    scoreKeeper = ScoreKeeper(guild)
    await scoreKeeper.calculateScore()
    scoreKeeper.saveScoreboard()
    print('Scoreboard has been written to file.')

@bot.command(name='hello', help='A simple hello command')
async def hello(ctx):
    greeting = f'Hello {ctx.author.nick}! Happy to see you here.'

    await ctx.send(greeting)

bot.run(TOKEN)
