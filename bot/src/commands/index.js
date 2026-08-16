import { setup } from './setup.js';
import { ticket } from './ticket.js';
import { addspend, removespend, syncboosters } from './leaderboard.js';
import { giveaway } from './giveaway.js';
import { ping, serverinfo, clear } from './utility.js';
import { poll, remind, stock } from './community.js';

export const commands = [setup, ticket, addspend, removespend, syncboosters, giveaway, ping, serverinfo, clear, poll, remind, stock];