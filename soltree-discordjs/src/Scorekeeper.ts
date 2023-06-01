import { Guild, GuildMember, TextChannel, MessageReaction, Message, User, Snowflake, TextBasedChannels, ThreadChannel, Collection } from 'discord.js';
import { writeFileSync, readFileSync } from 'fs';
import * as path from 'path';

const GAME_START_DATE = new Date('September 20, 2021 00:00:00');
const MSG_LIMIT = 100;
const STO_ID = '877966625993801739';
const GAME_CHANNELS = [
    'general',
    'motivation',
    'consensus',
    'quests',
    'feedback',
    'vision'
];

const normalizeDate = (date: Date): Date => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0,0,0,0);

    return normalizedDate;
}

// Given a Date object, return just the 'date' piece in iso format.
// ex: '2021-11-03'
const getKeyFromDate = (date: Date): string => {
    const normalizedDate = normalizeDate(date);
    return normalizedDate.toISOString().split('T')[0];
}

const parseIDsFromTag = (content: string): string[] => {
    const tokens = content.split(/\s/g);
    const ids = tokens.map(token => token.replace(/\D/g, '')).filter((id) => id.length > 15);

    return ids;
}

class RepTracker {
    repBonus: Map<string, number>

    constructor() {
        this.repBonus = new Map();
    }

    // If a player has given more than 5 REP on 1 day, then they do not get bonus exp
    public shouldAwardBonusEXP(date: Date): boolean {
        const dateKey = getKeyFromDate(date);

        if(this.repBonus.has(dateKey)) {
            this.repBonus.set(dateKey, this.repBonus.get(dateKey)! + 1);

            return this.repBonus.get(dateKey)! > 5 ? false : true;
        }

        this.repBonus.set(dateKey, 1);

        return true;
    }
}

interface PlayerStats {
    EXP: number;
    cREP: number;
    JCE: number;
}

class Player {
    name: string;
    discordID: Snowflake;
    stats: PlayerStats;
    repTracker: RepTracker;

    constructor(user: GuildMember) {
        this.name = user.displayName;
        this.discordID = user.id;
        this.repTracker = new RepTracker();
        this.stats = {
            EXP: 0,
            cREP: 0,
            JCE: 0,
        }
    }

    public getAtributesFromAction(action: Action) {
        this.addEXP(action.EXP);
        this.addJCE(action.JCE);
        this.addREP(action.REP);
    }

    public addEXP(exp: number) {
        if(exp >= 0) {
            this.stats.EXP += exp;

            return;
        }

        console.log(`EXP cannot be negative!\nGiven: ${exp}`);
    }

    public getEXP(): number {
        return this.stats.EXP;
    }

    public giveREP(date: Date, isPositive: boolean): Action | undefined {
        if(this.repTracker.shouldAwardBonusEXP(date)) {
            return new Action('rep', `Give ${isPositive ? '+' : '-'}REP`, date, 1);
        }
    }
    
    public addREP(cRep: number) {
        this.stats.cREP += cRep;
    }

    public GetREP(): number {
        return this.stats.cREP;
    }

    public addJCE(jce: number) {
        this.stats.JCE += jce;
    }

    public getJCE(): number {
        return this.stats.JCE;
    }
}

type ActionType = 'message' | 'quest' | 'reaction' | 'bounty' | 'rep' | 'proposal' | 'vote';

class Action {
    type: ActionType;
    description: string;
    content?: string;
    date: Date;
    EXP: number;
    REP: number;
    JCE: number

    constructor(type: ActionType = 'message', description: string = '', date: Date, exp: number = 0, rep: number = 0, jce: number = 0) {
        this.type = type;
        this.description = description;
        this.date = date;
        this.EXP = exp;
        this.REP = rep;
        this.JCE = jce;
    }

    public setContent(content: string) {
        this.content = content;
    }
}

class PlayerScore {
    playerName: string;
    actions: Action[];
    runningTotal: PlayerStats;

    constructor(name: string, actions: Action[] = []) {
        this.playerName = name;
        this.actions = actions;
        this.runningTotal = {
            EXP: 0,
            JCE: 0,
            cREP: 0,
        };
    }

    public updateRunningTotal(action: Action) {
        if(action.EXP >= 0) {
            this.runningTotal.EXP += action.EXP;
        } else {
            console.log(`Invalid Action, EXP must be positive: \n${action}`);
        }
        
        this.runningTotal.JCE += action.JCE;
        this.runningTotal.cREP += action.REP;
    }
}

class DailyScore {
    date: Date;
    scores: PlayerScore[]

    constructor(date: Date, scores: PlayerScore[] = []) {
        this.date = date;
        this.scores = scores;
    }
}

class PlayerManager {
    players: Player[] = [];

    public updatePlayer(update: Player) {
        let index = -1;

        for(const player of this.players) {
            index += 1;
            if(player.discordID === update.discordID) {
                break;
            }
        }

        if(index > -1) {
            this.players[index] = update;
            return;
        }

        console.log(`Could not find player: ${update.name}`);
    }
    
    public addPlayer(player: GuildMember): void {
        this.players.push(new Player(player));
    }

    public getPlayerByName(playerName: string): Player | undefined {
        const matchedPlayer = this.players.filter((player) => player.name === playerName);

        return matchedPlayer.length > 0 ? matchedPlayer[0] : undefined;
    }
    
    public getPlayerByID(playerID: Snowflake): Player | undefined {
        const matchedPlayer = this.players.filter((player) => player.discordID === playerID);

        return matchedPlayer.length > 0 ? matchedPlayer[0] : undefined;
    }
    
    public hasPlayerByID(playerID: Snowflake): boolean {
        return this.players.filter((player) => player.discordID === playerID).length > 0;
    }
    
    public hasPlayerByName(playerName: string): boolean {
        return this.players.filter((player) => player.name === playerName).length > 0;
    }
}

interface QuestDefinition {
    title: string;
    description: string;
    task: string;
    rewards: {
        openToREP: boolean;
        EXP?: number;
        JCE?: number;
        daily?: {
            [key: string]: {
                EXP: number;
            }
        }
    }
    
}

type BountyStatus = 'open' | 'fulfilled';

interface BountyRewards {
    description: string,
    winner: {
        openToREP: boolean;
        EXP: number;
        JCE: number;
    },
    participation?: {
        openToREP: boolean;
        EXP: number;
        JCE: number;
    }
}

interface BountyDefinition {
    title: string;
    description: string;
    task: string;
    status: BountyStatus;
    requirements: string;
    copyright: string;
    rewards: BountyRewards
}

interface PlayerBountyInfo {
    playerID: string,
    bountyName: string,
    fulfilled: boolean,
    reward: {
        EXP: number;
        JCE: number;
    }
}

/**
 * Keep track of all bounty definitions
 * Used by the Scoreboard to handle bounty completion
 */
class BountyManager {
    definitions: Map<string, BountyDefinition>;

    constructor() {
        this.definitions = new Map();
    }

    public addBounty(bounty: any): boolean {
        if(bounty.hasOwnProperty('title') &&
           bounty.hasOwnProperty('description') &&
           bounty.hasOwnProperty('task') &&
           bounty.hasOwnProperty('status') &&
           bounty.hasOwnProperty('requirements') &&
           bounty.hasOwnProperty('copyright') &&
           bounty.hasOwnProperty('rewards')) {
               const newBounty: BountyDefinition = {
                   title: bounty.title,
                   description: bounty.description,
                   task: bounty.task,
                   status: bounty.status,
                   requirements: bounty.requirements,
                   copyright: bounty.copyright,
                   rewards: bounty.rewards,
               }

               if(this.validateBounty(newBounty)) {
                   this.definitions.set(newBounty.title, newBounty);

                   return true;
               }
           }

        return false;
    }

    public bountyTitles(): string[] {
        return Array.from(this.definitions.keys());
    }
    
    public getPlayerBountyInfo(message: STGmessage): PlayerBountyInfo[] {
        console.log(`getPlayerBountyInfo()`)
        const thisDefinition = this.definitions.get(message.channel);
        const info: PlayerBountyInfo[] = [];

        if(thisDefinition) {
            const hasName = message.content.includes('@');

            if(hasName) {
                const IDs = parseIDsFromTag(message.content);
                const messageTokens = message.content.split(/\s/g);
                const isFulfilled = messageTokens.includes('fulfilled');
                let EXP = 0;
                let JCE = 0;

                if(IDs.length > 0) {
                    console.log(`found ${IDs.length} IDs`)
                    for(const ID of IDs) {
                        if(isFulfilled) {
                            EXP = thisDefinition.rewards.winner.EXP;
                            JCE = thisDefinition.rewards.winner.JCE;
                        } else {
                            if(thisDefinition.rewards.participation) {
                                EXP = thisDefinition.rewards.participation?.EXP;
                                JCE = thisDefinition.rewards.participation?.JCE;
                            } else {
                                continue;
                            }
                        }

                        console.log(`pushing info...`);

                        info.push({
                            playerID: ID,
                            bountyName: message.channel,
                            fulfilled: isFulfilled,
                            reward: {
                                EXP: EXP,
                                JCE: JCE,
                            },
                        });
                    }
                }
            }
        }

        return info;
    }
    
    public buildBountyAction(message: STGmessage): Action | undefined {
        const thisDefinition = this.definitions.get(message.channel);

        if(thisDefinition) {
            const nameTokens = message.content.split('@');

            if(nameTokens.length > 1) {
                const messageTokens = nameTokens[0].split(' ');
                const playerName = message.content.split('@')[1];

                if(messageTokens.includes('fulfilled')) {
                    const EXP = thisDefinition.rewards.winner.EXP;
                    const JCE = thisDefinition.rewards.winner.JCE;

                    return new Action('bounty', `bounty fulfilled - ${message.channel}`, message.createdAt, EXP, 0, JCE);
                } else {
                    const EXP = thisDefinition.rewards.participation?.EXP;
                    const JCE = thisDefinition.rewards.participation?.JCE;

                    return new Action('bounty', `bounty attempted - ${message.channel}`, message.createdAt, EXP, 0, JCE);
                }
            }
        }
    }
    
    private validateBounty(bounty: BountyDefinition): boolean {
        // Should have valid bounty status
        if(bounty.status !== 'open' && bounty.status !== 'fulfilled') {
            console.log('Bounty has invalid status')
            return false;
        }

        // Rewards should have description and winner
        if(!bounty.rewards.hasOwnProperty('description') ||
           !bounty.rewards.hasOwnProperty('winner')) {
               console.log('Bounty has invalid rewards - missing description or winner')
               return false;
        }

        if(!bounty.rewards.winner.hasOwnProperty('openToREP') ||
           !bounty.rewards.winner.hasOwnProperty('EXP') ||
           !bounty.rewards.winner.hasOwnProperty('JCE')) {
               console.log('bounty has invalid winner')
               return false;
           }
        
        if(bounty.rewards.hasOwnProperty('participation')) {
            if(!bounty.rewards.participation!.hasOwnProperty('openToREP') ||
               !bounty.rewards.participation!.hasOwnProperty('EXP') ||
               !bounty.rewards.participation!.hasOwnProperty('JCE')) {
                   console.log('bounty has invalid participation')
                   return false;
               }
        }

        return true;
    }
}

interface TrackedPlayer {
    name: string,
    currentStreak: number,
    responseDates: Date[],
}

class DailyQuestTracker {
    questTitle: string;
    rewards: {
        [key: string]: {
            EXP: number
        }
    }
    tracker: Map<string, TrackedPlayer>;
    highestStreak: number;

    constructor(quest: QuestDefinition) {
        this.questTitle = quest.title;
        this.rewards = this.setRewards(quest);
        this.highestStreak = this.setHighestStreak();
        this.tracker = new Map();
    }

    public trackPlayer(name: string, date: Date): Action {
        let player = this.tracker.get(name);
        
        if(!player) {
            player = {
                name: name,
                currentStreak: 1,
                responseDates: [date],
            }

            this.tracker.set(name, player);
        } else {
            const normalizedDate = normalizeDate(date);
            let streakExtended = false;

            for(const respDate of player.responseDates) {
                const normalizedRespDate = normalizeDate(respDate);

                if(Math.abs(normalizedDate.getTime() - normalizedRespDate.getTime()) === this.dayInMS()) {
                    streakExtended = true;
                    player.currentStreak += 1;
                    break;
                }
            }

            if(!streakExtended) {
                player.currentStreak = 1;
            }

            player.responseDates.push(date);
            this.tracker.set(name, player);
        }

        const exp = this.getEXPfromStreak(player.currentStreak);

        return new Action('quest', `Daily Quest - ${this.questTitle} - Day ${player.currentStreak}`, date, exp);
    }

    private setHighestStreak(): number {
        const rewardKeys = Object.keys(this.rewards);

        let highestStreak = 0;

        rewardKeys.forEach((key) => {
            const day = parseInt(key)

            if (!isNaN(day) && day > highestStreak) {
                highestStreak = day;
            }
        });

        return highestStreak;
    }
    
    private setRewards(quest: QuestDefinition) {
        if(quest.rewards.daily) {
            return quest.rewards.daily;
        }
        console.error('This is not a daily quest');

        return {
            'invalid': {
                EXP: -1,
            },
        };
    }

    private getEXPfromStreak(streak: number): number {
        if(streak >= this.highestStreak) {
            return this.rewards[this.highestStreak.toString()].EXP;
        }

        return this.rewards[streak.toString()].EXP
    }

    private dayInMS(): number {
        const minInMS = 1000 * 60

        const hourInMS = minInMS * 60
        
        const dayInMS = hourInMS * 24

        return dayInMS;
    }
}

/**
 * Keep track of all quest definitions
 * Used by the Scoreboard to handle quest responses
 */
class QuestManager {
    definitions: Map<string, QuestDefinition>;
    trackers: Map<string, DailyQuestTracker>;

    constructor() {
        this.definitions = new Map();
        this.trackers = new Map();
    }

    public buildQuestAction(message: STGmessage, fromMention=false): Action | undefined {
        // Assume all messages are quest responses
        // todo - handle messages that are not quest responses (ie. messages in response to quest responses)

        let questTitle = '';
        
        if(fromMention) {
            const msgTokens = message.content.split(/\s+/);

            questTitle = msgTokens[1];

            if(questTitle.toLowerCase() === 'check-in') {
                questTitle = 'Daily Quest - Check-In';
            }
        }

        const thisDefinition = fromMention ? this.definitions.get(questTitle) : this.definitions.get(message.channel);

        if(!thisDefinition) {
            return;
        }

        // Check if quest is daily
        if(!thisDefinition.rewards.EXP && !!thisDefinition.rewards.daily) {
            return this.buildActionForDailyQuest(message, thisDefinition);
        } else if(!thisDefinition.rewards.EXP) {
            console.log('Invalid quest definition');
            return;
        }

        // Quest is not daily
        return new Action('quest', `Quest - ${thisDefinition.title}`, message.createdAt, thisDefinition.rewards.EXP)
    }
    
    public questTitles(): string[] {
        return Array.from(this.definitions.keys());
    }
    
    public addQuest(quest: any): boolean {
        if(quest.hasOwnProperty('title') &&
           quest.hasOwnProperty('description') &&
           quest.hasOwnProperty('task') &&
           quest.hasOwnProperty('rewards')) {
            const newQuest: QuestDefinition = {
                title: quest.title,
                description: quest.description,
                task: quest.task,
                rewards: quest.rewards,
            }

            this.definitions.set(newQuest.title, newQuest);

            return true;
        }

        return false;
    }

    private buildActionForDailyQuest(message: STGmessage, quest: QuestDefinition): Action {
        const tracker = this.trackers.has(quest.title) ? this.trackers.get(quest.title)! : new DailyQuestTracker(quest);
        const action = tracker.trackPlayer(message.author, message.createdAt);

        this.trackers.set(quest.title, tracker);

        return action;
    }
}

class Scoreboard {
    playerManager: PlayerManager;
    questManager: QuestManager;
    bountyManager: BountyManager
    scoreHistory: Map<string, DailyScore>

    constructor() {
        console.log('Initializing Scoreboard')
        this.playerManager = new PlayerManager();
        this.questManager = new QuestManager();
        this.bountyManager = new BountyManager();
        this.scoreHistory = new Map();
    }

    public async initBounties() {
        const bountyPath = path.resolve('./data/bounties.json');

        try {
            const bountyBuffer = readFileSync(bountyPath);
            const bountyData = JSON.parse(bountyBuffer.toString()) as any[];
            
            let count = 0;
            bountyData.forEach((bounty) => {
                const bountyAdded = this.bountyManager.addBounty(bounty);

                if(bountyAdded) {
                    count += 1;
                } else {
                    console.log(`failed to add bounty: ${JSON.stringify(bounty, null, 2)}`);
                }
            });
            console.log(`Added ${count} bounties`);
        } catch(error) {
            console.error(error);
        }
    }
    
    public async initQuests() {
        const questPath = path.resolve('./data/quests.json');

        try {
            const questsBuffer = readFileSync(questPath);
            const questData = JSON.parse(questsBuffer.toString()) as any[];
            let count = 0;
            questData.forEach((quest) => {
                const questAdded = this.questManager.addQuest(quest);

                if(questAdded) {
                    count += 1;
                } else {
                    console.log(`failed to add quest: ${JSON.stringify(quest, null, 2)}`);
                }
            });
            console.log(`Added ${count} quests`);
        } catch(error) {
            console.error(error)
        }
    }
    
    public async initPlayers(guild: Guild): Promise<void> {
        const guildMembers = await guild.members.fetch();

        guildMembers.forEach((member: GuildMember ,key: string) => {
            if(member.id !== guild.ownerId && !member.user.bot) {
                this.playerManager.addPlayer(member);
            }
        })
    }
    
    public async updateDailyScoreForBounty(message: STGmessage): Promise<void> {
        await message.initReactions();
        let currentDailyScore = this.findDailyScore(message.createdAt);

        if(message.reactions.length > 0) {
            currentDailyScore = await this.trackReactions(message, currentDailyScore);
        }

        let playerBountyInfo = this.bountyManager.getPlayerBountyInfo(message);

        if(playerBountyInfo.length > 0) {
            console.log(`received some bounty info!`)

            playerBountyInfo.forEach((info) => {
                const bountyAction = new Action('bounty', 
                `${info.fulfilled ? 'fulfilled' : 'attempted'} bounty - ${info.bountyName}`,
                message.createdAt,
                info.reward.EXP,
                0,
                info.reward.JCE);
            
                const player = this.playerManager.getPlayerByID(info.playerID);
                if(player) {
                    console.log(`updating daily score...`)
                    currentDailyScore = this.updateDailyScore(bountyAction, currentDailyScore, player.name);
                }
            })
        }

        this.updateScoreHistory(message.createdAt, currentDailyScore);
    }
    
    public async updateDailyScoreForMessage(message: STGmessage): Promise<void> {
        await message.initReactions();

        let currentDailyScore = this.findDailyScore(message.createdAt);
        currentDailyScore = await this.setValues(message, currentDailyScore);

        this.updateScoreHistory(message.createdAt, currentDailyScore);
    }

    public async handleQuestEdgeCase(message: STGmessage) {
        if(message.channel !== 'quests') {
            return;
        }

        if(message.messageSource.author.id !== STO_ID) {
            return;
        }
        
        await message.initReactions();

        let currentDailyScore = this.findDailyScore(message.createdAt);

        if(message.reactions.length > 0) {
            currentDailyScore = await this.trackReactions(message, currentDailyScore);
        }

        if(this.questManager.questTitles().includes(message.channel) &&
            message.messageSource.author.id === STO_ID) {
            
            const IDs = parseIDsFromTag(message.content);
            if(IDs.length > 0) {
                // console.log(message.content);
                const edgeCaseQuestAction = this.questManager.buildQuestAction(message);

                if(edgeCaseQuestAction) {
                    for(const ID of IDs) {
                        const player = this.playerManager.getPlayerByID(ID);

                        if(player) {
                            currentDailyScore = this.updateDailyScore(edgeCaseQuestAction, currentDailyScore, player.name);
                        }
                    }
                }
            }
        }

        this.updateScoreHistory(message.createdAt, currentDailyScore);
    }
    
    public toJSON(): Object {
        const sortedHistory = Array.from(this.scoreHistory.values()).sort((a, b) => {
            return a.date.getTime() - b.date.getTime();
        });

        return {
            'players': this.playerManager.players,
            'scoreHistory': sortedHistory,
        }
    }
    
    public sumPlayerScores() {
        let currentPlayer: Player | undefined;
        this.scoreHistory.forEach((dailyScore) => {
            dailyScore.scores.forEach((score) => {
                currentPlayer = this.playerManager.getPlayerByName(score.playerName);

                if(currentPlayer) {
                    score.actions.forEach((action) => {
                        currentPlayer!.getAtributesFromAction(action);
                    });

                    this.playerManager.updatePlayer(currentPlayer);
                } else {
                    console.log(`Could not find player: ${score.playerName}`);
                }
            })
        })
    }
    
    private async trackReactions(message: STGmessage, dailyScore: DailyScore): Promise<DailyScore> {
        let updatedDailyScore = dailyScore;
        
        const reactedPlayers: Player[] = [];
        const thumbsUp = '👍';
        let reactionEmoji: string;
        

        for(const reaction of message.reactions) {
            reactionEmoji = reaction.emoji.toString();

            const users: User[] = Array.from(reaction.users.cache.values());
            const players: (Player | undefined)[] = users.map(user => {
                return this.playerManager.getPlayerByID(user.id);
            });

            for(const player of players) {
                if(!player) {
                    continue;   
                }

                if(reactionEmoji.length === 4){ // Reaction might have skin tone attached
                    reactionEmoji = reactionEmoji.slice(0, 2);
                }

                if(reactionEmoji === thumbsUp) {
                    // Track +REP
                    const plusREPAction = player.giveREP(message.createdAt, true);
                    
                    // It's possible to +REP the admin account, filter those out
                    if(message.authorValid) {
                        const receiveREPAction = new Action('rep', `Received +REP from ${player.name}`, message.createdAt, 0, 1);
                        updatedDailyScore = this.updateDailyScore(receiveREPAction, updatedDailyScore, message.author);
                    }
                    
                    if(plusREPAction) {
                        updatedDailyScore = this.updateDailyScore(plusREPAction, updatedDailyScore, player.name);
                    }
                    const reactionAction = new Action('reaction', `reacted to message - ${message.channel}`, message.createdAt, 1);
                    updatedDailyScore = this.updateDailyScore(reactionAction, updatedDailyScore, player.name);

                    reactedPlayers.push(player);
                }

                if(!reactedPlayers.includes(player)) {
                    reactedPlayers.push(player);

                    const reactionAction = new Action('reaction', `reacted to message - ${message.channel}`, message.createdAt, 1);
                    updatedDailyScore = this.updateDailyScore(reactionAction, updatedDailyScore, player.name);
                }
            }
        }

        return updatedDailyScore;
    }
    
    private async setValues(message: STGmessage, dailyScore: DailyScore) {
        let updatedDailyScore = dailyScore;
        
        if(message.reactions.length > 0) {
            updatedDailyScore = await this.trackReactions(message, dailyScore);
        }

        if(message.channel === 'general' ||
           message.channel === 'motivation' ||
           message.channel === 'feedback' ||
           message.channel === 'vision') {
            if(this.messageIsQuest(message)) {
                const questAction = this.questManager.buildQuestAction(message, true);

                if(questAction) {
                    updatedDailyScore = this.updateDailyScore(questAction, updatedDailyScore, message.author);
                }
                
            } else {
                const messageAction = new Action('message', `Message - #${message.channel}`, message.createdAt, 2);
                messageAction.setContent(message.content);
                updatedDailyScore = this.updateDailyScore(messageAction, updatedDailyScore, message.author);
            }
        } else if(this.questManager.questTitles().includes(message.channel)) {
            console.log(`setValues()\nmessage.channel: ${message.channel}`);
            const questAction = this.questManager.buildQuestAction(message);
            
            if(questAction) {
                updatedDailyScore = this.updateDailyScore(questAction, updatedDailyScore, message.author);
            }
        } else if(message.channel === 'consensus') {
            updatedDailyScore = await this.handleConsensus(message, updatedDailyScore);
        }
        
        return updatedDailyScore;
    }
    
    private async handleConsensus(message: STGmessage, dailyScore: DailyScore): Promise<DailyScore> {
        let updatedDailyScore = dailyScore;

        if(message.reactions.length > 0) {
            const ballotBox = '🗳️';
            const ballotBoxCheck = '☑️'
            let reactionEmoji: string;

            for(const reaction of message.reactions) {
                reactionEmoji = reaction.emoji.toString();

                if(reaction.users.cache.has(STO_ID)) {
                    if(reactionEmoji === ballotBox) {
                        const proposalAction = new Action('proposal', 'Proposal', message.createdAt, 15);

                        updatedDailyScore = this.updateDailyScore(proposalAction, updatedDailyScore, message.author);
                    } else if(reactionEmoji === ballotBoxCheck) {
                        const voteAction = new Action('vote', 'Vote', message.createdAt, 10);

                        updatedDailyScore = this.updateDailyScore(voteAction, updatedDailyScore, message.author);

                    }
                }
            }
            
        }

        const messageAction = new Action('message', 'Message - Any Channel', message.createdAt, 2);
        const consensusMsgAction = new Action('message', 'Message - #consensus', message.createdAt, 3);
        consensusMsgAction.setContent(message.content);

        updatedDailyScore = this.updateDailyScore(messageAction, updatedDailyScore, message.author);
        updatedDailyScore = this.updateDailyScore(consensusMsgAction, updatedDailyScore, message.author);

        return updatedDailyScore;
    }
    
    private messageIsQuest(message: STGmessage): boolean {
        const msgContentTokens = message.content.split(' ');

        if(msgContentTokens[0].toLowerCase() === '@stgquest') {
            return true;
        }

        return false;
    }
    
    private updateScoreHistory(date: Date, dailyScore: DailyScore) {
        const dateKey = getKeyFromDate(date);

        this.scoreHistory.set(dateKey, dailyScore);
    }
    
    private updateDailyScore(action: Action, dailyScore: DailyScore, playerName: string): DailyScore {
        const updatedDailyScore = dailyScore;

        let scoreFound = false;

        updatedDailyScore.scores.forEach(score => {
            if(score.playerName === playerName) {
                scoreFound = true;
                score.actions.push(action);
                score.updateRunningTotal(action);
            }
        });

        if(!scoreFound) {
            const newScore = new PlayerScore(playerName, [action]);
            newScore.updateRunningTotal(action);
            updatedDailyScore.scores.push(newScore);
        }

        return updatedDailyScore
    }
    
    private findDailyScore(date: Date): DailyScore {
        const dateKey = getKeyFromDate(date);

        if(this.scoreHistory.has(dateKey)) {
            return this.scoreHistory.get(dateKey)!;
        }

        return new DailyScore(date);
    }
}

class STGmessage {
    content: string;
    author: string;
    reactions: MessageReaction[];
    createdAt: Date;
    messageSource: Message;
    channel: string;
    authorValid: boolean;
    msgValid: boolean;

    constructor(srcMsg: Message, playerManager: PlayerManager) {
        this.authorValid = false;
        this.msgValid = false;
        this.messageSource = srcMsg;
        this.reactions = [];
        this.content = srcMsg.content;
        this.createdAt = srcMsg.createdAt;
        this.author = this.setAuthor(srcMsg.author, playerManager);
        this.channel = this.setChannel(srcMsg.channel);
        this.setAuthorValid();
        this.setMsgValid();
    }

    public async initReactions() {
        this.reactions = this.messageSource.reactions.cache.map((reaction) => reaction);
        
        // Fetch users for each reaction
        for(const reaction of this.reactions) {
            await reaction.users.fetch();
        }
    }
    
    private setMsgValid() {
        if(this.messageSource.type === 'THREAD_CREATED') {
            this.msgValid = false;
            return;
        }

        if(this.content === '') {
            this.msgValid = false;
            return;
        }

        this.msgValid = true;
    }
    
    private setAuthorValid(): void {
        (this.author.length  === 0) ?
            this.authorValid = false:
            this.authorValid = true;
    }
    
    private setChannel(channel: TextBasedChannels): string {
        if(channel instanceof TextChannel || channel instanceof ThreadChannel) {
            return channel.name;
        }
        
        return '';
    }
    
    private setAuthor(author: User, playerManager: PlayerManager): string {
        const playerAuthor = playerManager.getPlayerByID(author.id);

        if(playerAuthor) {
            return playerAuthor.name;
        }


        return '';
    }

}

class STGchannel {
    name: string;
    messages: STGmessage[];
    channelSource: TextChannel;
    scoreboard: Scoreboard;
    initialized: boolean;

    constructor(channel: TextChannel, scoreboard: Scoreboard) {
        this.channelSource = channel;
        this.name = channel.name;
        this.scoreboard = scoreboard;
        this.initialized = false;
        this.messages = [];
    }

    public async initMessages(): Promise<void> {
        if(this.scoreboard && this.channelSource) {
            await this.initThreadMessages();
            await this.setMessagesFromSource(this.channelSource);
        }

        this.messages.reverse();
        this.initialized = true;
    }

    private async initThreadMessages(): Promise<void> {
        await this.channelSource.threads.fetchArchived();
        const threads = this.channelSource.threads.cache;

        if(threads.size > 0) {
            for(const [,thread] of threads) {
                await this.setMessagesFromSource(thread);
            }
        }
    }

    private async setMessagesFromSource(source: TextChannel | ThreadChannel): Promise<void> {
        const sourceMessages = await source.messages.fetch({limit: MSG_LIMIT})

        let tempMsg: STGmessage;
        sourceMessages.forEach((message) => {
            tempMsg = new STGmessage(message, this.scoreboard.playerManager);

            if(tempMsg.authorValid || this.name === 'bounties' || this.name === 'quests') {
                this.messages.push(tempMsg);
            }
        });
    }
}

export class Scorekeeper {
    guild: Guild;
    channels: STGchannel[] = [];
    scoreboard: Scoreboard;

    constructor(guild: Guild) {
        console.log('Initialized Scorekeeper...')
        this.guild = guild;
        this.scoreboard = new Scoreboard();
    }

    public async init() {
        await this.initPlayers();
        this.initChannels();
        await this.initQuests();
        await this.initBounties();
    }

    public async calculateScore() {
        if(!this.channels) {
            return;
        }

        for(const channel of this.channels) {
            if(!channel.initialized) {
                await channel.initMessages();
            }

            if(channel.name === 'bounties') {
                for(const message of channel.messages) {
                    await this.calculateScoreForBounty(message);
                }
            } else if(GAME_CHANNELS.includes(channel.name)) {
                for(const message of channel.messages) {
                    await this.calculateScoreForMessage(message);
                }
            }
        }

        this.sumPlayerScores();
    }
    
    public saveScoreboard(): void {
        const scoreboardPath = path.resolve('./data/scoreboard.json');

        try {
            writeFileSync(scoreboardPath, JSON.stringify(this.scoreboard.toJSON(), null, 2));
        } catch(error) {
            console.error(error);
        }
    }
    
    public listMessages(channelName: string): void {
        if(this.channels.some((channel) => channel.name === channelName)) {
            const channel = this.channels.filter((channel) => channel.name === channelName)[0];

            if(channel.initialized) {
                channel.messages.forEach(message => console.dir(message));
            }
        }
    }
    
    public listPlayers(): void {
        console.log('Players: \n');
        this.scoreboard.playerManager.players.forEach((player) => {
            console.log(`${player.name}`);
        })
    }

    public listChannels(): void {
        console.log('Channels: \n');
        this.channels.forEach((channel) => console.log(channel.name));
    }
    
    private async initBounties() {
        console.log(`Scorekeeper initializing bounties...`);
        await this.scoreboard.initBounties();
    }
    
    private async initQuests() {
        console.log(`Scorekeeper initializing quests...`);
        await this.scoreboard.initQuests();
    }

    private async initPlayers(): Promise<void> {
        await this.scoreboard.initPlayers(this.guild);
    }
    
    private async calculateScoreForMessage(message: STGmessage): Promise<void> {
        if(message.msgValid) {
            if(message.authorValid && message.createdAt >= GAME_START_DATE) {
                await this.scoreboard.updateDailyScoreForMessage(message);
            } else {
                await this.scoreboard.handleQuestEdgeCase(message);
            }
        }
    }
    
    private async calculateScoreForBounty(message: STGmessage): Promise<void> {
        await this.scoreboard.updateDailyScoreForBounty(message);
    }
    
    private sumPlayerScores(): void {
        this.scoreboard.sumPlayerScores();
    }
    
    private initChannels(): void {
        console.log('Scorekeeper.initChannels()');
        this.channels = [];

        this.guild.channels.cache.forEach((channel) => {
            if(channel.type === 'GUILD_TEXT') {
                this.channels.push(
                    new STGchannel(channel as TextChannel, this.scoreboard)
                )
            }
        });
    }
}
