import jsons
import os
import emoji

from enum import Enum
from discord import Guild, Member, ChannelType, Message, TextChannel, Reaction, User
from typing import List, Union, Tuple
from datetime import datetime, date
from pathlib import Path

GAME_START_DATE = date(2021, 9, 20)


class Player:
    name: str = ''
    EXP: int = 0
    cREP: int = 0
    JCE: int = 0

    def __init__(self, name: str = '') -> None:
        if isinstance(name, str):
            self.name = name
        else:
            raise ValueError('name is not a str!!')
        
        return
    
    def addJCE(self, newJCE: int = 0) -> None:
        if isinstance(newJCE, int):
            self.JCE += newJCE
        else:
            raise ValueError('JCE must be int')
    
    def addREP(self, newREP: int = 0) -> None:
        if isinstance(newREP, int):
            self.cREP += newREP
        else:
            raise ValueError('REP must be int')
    
    def addEXP(self, newEXP: int = 0) -> None:
        if isinstance(newEXP, int):
            if newEXP >= 0:
                self.EXP += newEXP
            else:
                raise ValueError('Can only add EXP, not remove')
        else:
            raise ValueError('EXP must be int')
    
    def toJSON(self) -> dict:
        return {
            'name': self.name,
            'EXP': self.EXP,
            'cREP': self.cREP,
            'JCE': self.JCE
        }
    
    def __str__(self) -> str:
        thisPlayer = self.toJSON()
        return jsons.dumps(thisPlayer, indent=4)


class PlayerManager:
    players: List[Player] = []

    def __init__(self) -> None:
        pass

    
    def getAllPlayers(self) -> List[Player]:
        return self.players
    
    
    def updatePlayer(self, update: Player) -> None:
        index = 0
        
        for player in self.players:
            if player.name == update.name:
                break
            
            index += 1
        
        self.players[index] = update
        
        return
    
    
    def getPlayer(self, playerName: str) -> Union[Player, None]:
        for player in self.players:
            if player.name == playerName:
                return player
        return
    
    
    def addPlayer(self, playerName: str) -> None:
        self.players.append(Player(playerName))

        return


class ActionType(Enum):
    MESSAGE = 1
    QUEST = 2
    REACTION = 3
    BOUNTY = 4
    REP = 5


class Action:
    type: ActionType
    description: str
    EXP: int
    REP: int
    JCE: int

    def __init__(self, type: ActionType = ActionType.MESSAGE, description: str = '', EXP: int = 0, JCE: int = 0, REP: int = 0) -> None:
        self.type = type
        self.description = description
        self.EXP = EXP
        self.JCE = JCE
        self.REP = REP

    def toJSON(self) -> dict:
        return {
            'type': self.type,
            'description': self.description,
            'EXP': self.EXP,
            'REP': self.REP,
            'JCE': self.JCE
        }
    
    def __str__(self) -> str:
        thisAction = self.toJSON

        return jsons.dumps(thisAction, indent=4)


class PlayerScore:
    playerName: str
    actions: List[Action]

    def __init__(self, name: str, actions: List[Action]) -> None:
        self.playerName = name
        self.actions = actions
        pass

    def toJSON(self) -> dict:
        return {
            'name': self.playerName,
            'actions': self.actions
        }
    
    def __str__(self) -> str:
        thisScore = self.toJSON()
        return jsons.dumps(thisScore, indent=4)


class DailyScore:
    date: date
    scores: List[PlayerScore]

    def __init__(self, date: date) -> None:
        self.date = date
        self.scores = []
        pass

    def toJSON(self) -> dict:
        return {
            'date': self.date,
            'scores': self.scores,
        }

    def __str__(self) -> str:
        thisScore = self.toJSON()
        return jsons.dumps(thisScore, indent=4)


class STGMessage:
    content: str
    author: str
    reactions: List[Reaction]
    createdAt: datetime
    messageSource: Message
    channel: str
    isValid: bool

    def __init__(self, sourceMessage: Message) -> None:
        self.isValid = False
        self.messageSource = sourceMessage
        self.reactions = sourceMessage.reactions
        self.content = sourceMessage.content
        self.createdAt = sourceMessage.created_at
        self.author = self.__setAuthor(sourceMessage.author)
        self.channel = self.__setChannel(sourceMessage.channel)
        return
    
    def toJSON(self) -> dict:
        return {
            'author': self.author,
            'content': self.content,
            'createdAt': self.createdAt,
        }
    
    def __setChannel(self, channel) -> Union[str, None]:
        if isinstance(channel, TextChannel):
            return channel.name
        else:
            self.isValid = False
            return

    def __setAuthor(self, author: Member) -> Union[Player, None]:
        if not isinstance(author, Member):
            print('Error - author does not belong to guild')
            return
        
        if author.bot:
            return

        if author.nick is None:
            self.isValid = True
            return author.name
        
        else:
            self.isValid = True
            return author.nick
    
    def __str__(self) -> str:
        if self.isValid:
            thisMessage = self.toJSON()

            return jsons.dumps(thisMessage, indent=4)
        
        return 'Invalid Message'


class Scoreboard:
    playerManager: PlayerManager
    scoreHistory: List[DailyScore] = []

    def __init__(self, guild: Guild) -> None:
        self.playerManager = PlayerManager()
        self.__initPlayers(guild)
        pass

    def sumPlayerScores(self) -> None:
        """
        Take all the actions for each player for all the days in the score history
        and sum them up so that the player has a total score
        """
        currentPlayer: Player = None

        for dailyScore in self.scoreHistory:
            for playerScore in dailyScore.scores:
                currentPlayer = self.playerManager.getPlayer(playerScore.playerName)

                if currentPlayer is not None:
                    for action in playerScore.actions:
                        currentPlayer.addEXP(action.EXP)
                        currentPlayer.addREP(action.REP)
                        currentPlayer.addJCE(action.JCE)
                    
                    self.playerManager.updatePlayer(currentPlayer)
                else:
                    print(f'Could not find player: {playerScore.playerName}')
                
        return
    
    async def updateDailyScoreForMessage(self, message: STGMessage) -> None:
        # Find the daily score for the day the message was created
        dailyScoreWithIndex = self.__findDailyScore(message.createdAt.date())
        currentDailyScore = dailyScoreWithIndex[0]
        index = dailyScoreWithIndex[1]
        
        
        # Update the daily score with the new values
        currentDailyScore = await self.__setValues(message, currentDailyScore)

        if index > -1:
            self.scoreHistory[index] = currentDailyScore
        else:
            self.scoreHistory.append(currentDailyScore)
        
        return
    
    def printScoreboard(self) -> None:
        print(jsons.dumps(self.toJSON(), jdkwargs={'indent': 4}))

        return
    
    def getPlayer(self, playerName: str) -> Union[Player, None]:
        return self.playerManager.getPlayer(playerName)
    
    def toJSON(self) -> dict:
        self.__sortScoreHistory()

        return {
            'players': [player.toJSON() for player in self.playerManager.getAllPlayers()],
            'scoreHistory': [dailyScore.toJSON() for dailyScore in self.scoreHistory]
        }
    
    async def __trackReactions(self, msg: STGMessage, currentDailyScore: DailyScore) -> DailyScore:
        print(f'reactions: {msg.reactions}')
        updatedDailyScore = currentDailyScore
        playerReactions = {}
        thumbsUp = '👍️'

        for reaction in msg.reactions:
            if(reaction.emoji[0] == thumbsUp[0]):
                print('+REP!!')
                async for user in reaction.users():
                    print(f'User: {user.name}')

                    if isinstance(user, Member):
                        reactingPlayerName = user.name if user.nick is None else user.nick
                        print(f'reactingPlayerName: {reactingPlayerName}')
                        giveREPaction = Action(ActionType.REP, f'give +REP({msg.author})', 2)
                        receiveREPaction = Action(ActionType.REP, f'receive +REP({reactingPlayerName})', 0, 0, 1)
                        
                        reactorScoreFound = False
                        authorScoreFound = False

                        for score in updatedDailyScore.scores:
                            if score.playerName == reactingPlayerName:
                                reactorScoreFound = True
                                score.actions.append(giveREPaction)
                            if score.playerName == msg.author:
                                authorScoreFound = True
                                score.actions.append(receiveREPaction)
                        
                        if not reactorScoreFound:
                            newScore = PlayerScore(reactingPlayerName, [giveREPaction])
                            updatedDailyScore.scores.append(newScore)
                        
                        if not authorScoreFound and msg.author != 'SolTree':
                            newScore = PlayerScore(msg.author, [receiveREPaction])
                            updatedDailyScore.scores.append(newScore)

                # player = self.playerManager.getPlayer(user.name)
                
        
        return updatedDailyScore

    def __sortScoreHistory(self) -> None:
        self.scoreHistory.sort(key=lambda dailyScore: dailyScore.date, reverse=True)
    
    async def __setValues(self, message: STGMessage, currentDailyScore: DailyScore) -> DailyScore:
        if len(message.reactions) > 0:
            await self.__trackReactions(message, currentDailyScore)
            
        
        updatedDailyScore = currentDailyScore

        if message.channel == 'general':
            msgAction = Action(ActionType.MESSAGE, 'Message - #general', 2)
            scoreFound = False

            for score in updatedDailyScore.scores:
                if score.playerName == message.author:
                    scoreFound = True
                    score.actions.append(msgAction)
            
            if not scoreFound:
                newScore = PlayerScore(message.author, [msgAction])
                updatedDailyScore.scores.append(newScore)

        return updatedDailyScore
    
    # Return the daily score and the index of the array that it was found, if found
    # Otherwise the index returned will be -1
    def __findDailyScore(self, date: date) -> Tuple[DailyScore, int]:
        currentDailyScore: DailyScore = None
        index = 0

        for score in self.scoreHistory:
            if date == score.date:
                currentDailyScore = score
                break
            index += 1
        

        if not currentDailyScore:
            currentDailyScore = DailyScore(date)
            index = -1
        
        return currentDailyScore, index
    
    def __initPlayers(self, guild: Guild) -> None:
        for member in guild.members:
            playerName: str = ''

            if member != guild.owner and not member.bot:
                if member.nick is not None:
                    playerName = member.nick
                else:
                    playerName = member.name
            
                self.playerManager.addPlayer(playerName)
        
        return
    
    pass


class STGChannel:
    name: str = ''
    messages: List[STGMessage] = []
    channelSource: TextChannel = None
    scoreboard: Scoreboard = None
    initialized: bool = False

    def __init__(self, channel: TextChannel = None, scoreboard = None) -> None:
        self.channelSource = channel
        self.name = channel.name
        self.scoreboard = scoreboard

        return
    
    def getMessages(self) -> List[STGMessage]:
        return self.messages

    async def initMessages(self) -> None:
        if self.scoreboard is None:
            print('Scoreboard not initialized!')
            return
        
        if self.channelSource is None:
            print('Could not initialize messages, channel source is None!')
        
        sourceMessages = await self.channelSource.history(limit=250).flatten()
        tempMessage: STGMessage = None

        for message in sourceMessages:
            tempMessage = STGMessage(message)
            self.messages.append(tempMessage)
        
        self.initialized = True
        return


class ScoreKeeper:
    channels: List[STGChannel] = []
    guild: Guild = None
    scoreboard: Scoreboard = None

    def __init__(self, guild: Guild) -> None:
        self.guild = guild
        self.__initScoreboard()
        self.__initChannels()
        pass
    
    async def calculateScore(self) -> Scoreboard:
        channelMessages: List[STGMessage] = []
        
        # Iterate through every channel
        if self.channels:
            for channel in self.channels: 
                if channel.name == 'general':

                    if not channel.initialized:
                        await channel.initMessages()
                    
                    channelMessages = channel.getMessages()
            
                    # Get every message after the start date
                    for message in channelMessages:
                        if message.createdAt.date() >= GAME_START_DATE:

                            # Calculate score for each valid message
                            if message.isValid:
                                await self.__calculateScoreForMessage(message)
                    
                    channelMessages.clear()
            
        # Sum the player scores
        self.scoreboard.sumPlayerScores()
        
        return self.scoreboard
    
    def printChannels(self) -> None:
        print(str(len(self.channels)))
        print('\n\n')
        # for channel in self.channels:
        #     print(channel.name)
        #     print('\n\n')
    
    async def printChannelMessages(self, channelName: str) -> None:
        # find channel whose name matches
        selectedChannel: STGChannel = None

        for channel in self.channels:
            if channel.name == channelName:
                selectedChannel = channel
        
        # initialize the messages
        await selectedChannel.initMessages()
        
        # print the result
        print(f'Messages from the {channelName} channel:\n')

        for msg in selectedChannel.getMessages():
            print(msg)
            print('\n\n\n')
        
        pass
    
    def saveScoreboard(self) -> None:
        if self.scoreboard is not None:
            # Get path
            currentDir = os.path.dirname(os.path.abspath(__file__))
            relativeFilePath = 'data/scoreboard.json'
            absoluteFilePath = os.path.join(currentDir, relativeFilePath)

            # Open file for writing
            with open(absoluteFilePath, 'w') as scoreboardFile:
                scoreboardFile.write(jsons.dumps(self.scoreboard.toJSON(), jdkwargs={'indent': 2}))
        
        return
    
    def printPlayers(self) -> None:
        players = f'\n'.join([f'Name: {player.name}\nEXP: {player.EXP}\ncREP: {player.cREP}\nJCE: {player.JCE}\n\n' for player in self.players])
        print(f'Players:\n\n{players}') 
        
        return
    
    def printChannels(self) -> None:
        print('Channels: ')
        for channel in self.channels:
            print(channel)
    
    async def __calculateScoreForMessage(self, message: STGMessage) -> None:
        return await self.scoreboard.updateDailyScoreForMessage(message)
    
    def __initScoreboard(self) -> None:
        self.scoreboard = Scoreboard(self.guild)
        
        return
    
    def __initChannels(self) -> None:
        for channel in self.guild.channels:
            if channel.type == ChannelType.text:
                self.channels.append(STGChannel(channel, self.scoreboard))
        return
