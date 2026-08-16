import { setup } from './setup.js';
import { ticket } from './ticket.js';
import { addspend, syncboosters } from './leaderboard.js';
import { giveaway } from './giveaway.js';
import { ping, serverinfo, clear } from './utility.js';

export const commands = [setup, ticket, addspend, syncboosters, giveaway, ping, serverinfo, clear];