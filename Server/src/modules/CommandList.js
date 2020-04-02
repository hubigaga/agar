// Imports
var GameMode = require('../gamemodes');
var Logger = require('./Logger');

function Commands() {
    this.list = {}; // Empty
}

module.exports = Commands;

// Utils
var fillChar = function (data, char, fieldLength, rTL) {
    var result = data.toString();
    if (rTL === true) {
        for (var i = result.length; i < fieldLength; i++)
            result = char.concat(result);
    } else {
        for (var i = result.length; i < fieldLength; i++)
            result = result.concat(char);
    }
    return result;
};

// Commands
Commands.list = {
    help: function (gameServer, split) {
        var answer = [];
        answer.push("======================== HELP ======================");
        answer.push("addbot [number]              : adds bots to the server");
        answer.push("kickbot [number]             : kick a number of bots");
        answer.push("ban [PlayerID | IP]          : bans a(n) (player's) IP");
        answer.push("banlist                      : get list of banned IPs.");
        answer.push("board [string] [string] ...  : set scoreboard text");
        answer.push("change [setting] [value]     : change specified settings");
        answer.push("clear                        : clear console output");
        answer.push("color [PlayerID] [R] [G] [B] : set cell(s) color by client ID");
        answer.push("exit                         : stop the server");
        answer.push("kick [PlayerID]              : kick player or bot by client ID");
        answer.push("kickall                      : kick all players and bots");
        answer.push("mute [PlayerID]              : mute player (block chat messages from him)");
        answer.push("unmute [PlayerID]            : unmute player (allow chat messages from him)");
        answer.push("kill [PlayerID]              : kill cell(s) by client ID");
        answer.push("killall                      : kill everyone");
        answer.push("mass [PlayerID] [mass]       : set cell(s) mass by client ID");
        answer.push("merge [PlayerID]             : merge all client's cells once");
        answer.push("name [PlayerID] [name]       : change cell(s) name by client ID");
        answer.push("playerlist                   : get list of players and bots");
        answer.push("pause                        : pause game , freeze all cells");
        answer.push("reload                       : reload config");
        answer.push("status                       : get server status");
        answer.push("unban [IP]                   : unban an IP");
        answer.push("minion [PlayerID] [#] [name] : adds suicide minions to the server");
        answer.push("spawnmass [PlayerID] [mass]  : sets players spawn mass");
        answer.push("freeze [PlayerID]            : freezes a player");
        answer.push("speed [PlayerID]             : sets a players base speed");
        answer.push("rec [PlayerID]               : puts a player in rec mode");
        answer.push("st                           : alias for status");
        answer.push("pl                           : alias for playerlist");
        answer.push("m                            : alias for mass");
        answer.push("sm                           : alias for spawnmass");
        answer.push("ka                           : alias for killall");
        answer.push("k                            : alias for kill");
        answer.push("mg                           : alias for merge");
        answer.push("s                            : alias for speed");
        answer.push("====================================================");
        return answer;
    },
    debug: function (gameServer, split) {
        var answer = [];
        // Used for checking node lengths (for now)
        
        // Count client cells
        var clientCells = 0;
        for (var i in gameServer.clients) {
            clientCells += gameServer.clients[i].playerTracker.cells.length;
        }
        // Output node information
        answer.push("Clients:        " + fillChar(gameServer.clients.length, " ", 4, true) + " / " + gameServer.config.serverMaxConnections + " + bots");
        answer.push("Total nodes:" + fillChar(gameServer.nodes.length, " ", 8, true));
        answer.push("- Client cells: " + fillChar(clientCells, " ", 4, true) + " / " + (gameServer.clients.length * gameServer.config.playerMaxCells));
        answer.push("- Ejected cells:" + fillChar(gameServer.nodesEjected.length, " ", 4, true));
        answer.push("- Foods:        " + fillChar(gameServer.currentFood, " ", 4, true) + " / " + gameServer.config.foodMaxAmount);
        answer.push("- Viruses:      " + fillChar(gameServer.nodesVirus.length, " ", 4, true) + " / " + gameServer.config.virusMaxAmount);
        answer.push("Moving nodes:   " + fillChar(gameServer.movingNodes.length, " ", 4, true));
        answer.push("Quad nodes:     " + fillChar(gameServer.quadTree.scanNodeCount(), " ", 4, true));
        answer.push("Quad items:     " + fillChar(gameServer.quadTree.scanItemCount(), " ", 4, true));
        return answer;
    },
    minion: function(gameServer, split) {
        var answer = [];
        var id = parseInt(split[1]);
        var add = parseInt(split[2]);
        var name = split.slice(3, split.length).join(' ');
            
        // Error! ID is NaN
        if (isNaN(id)) {
            return ["Please specify a valid player id!"];
        }
        
        // Find ID specified and add/remove minions for them
        for (var i in gameServer.clients) {
            var client = gameServer.clients[i].playerTracker;
            
            if (client.pID == id) {
                // Remove minions
                if (client.minionControl == true && isNaN(add)) {
                    client.minionControl = false;
                    client.miQ = 0;
                    answer.push("Succesfully removed minions for " + client.getFriendlyName());
                // Add minions
                } else {
                    client.minionControl = true;
                    // If no amount is specified
                    if (isNaN(add)) add = 1; 
                    // Add minions for client
                    for (var i = 0; i < add; i++) {
                        gameServer.bots.addMinion(client, name);
                    }
                    answer.push("Added " + add + " minions for " + client.getFriendlyName());
                }
                break;
            }
        }
        return answer;
    },
    addbot: function (gameServer, split) {
        var add = parseInt(split[1]);
        if (isNaN(add)) {
            add = 1; // Adds 1 bot if user doesnt specify a number
        }
        
        for (var i = 0; i < add; i++) {
            gameServer.bots.addBot();
        }
        return ["Added " + add + " player bots"];
    },
    ban: function (gameServer, split) {
        // Error message
        var logInvalid = "Please specify a valid player ID or IP address!";
        
        if (split[1] == null) {
            // If no input is given; added to avoid error
            return [logInvalid];
        }
        
        if (split[1].indexOf(".") >= 0) {
            // If input is an IP address
            var ip = split[1];
            var ipParts = ip.split(".");
            
            // Check for invalid decimal numbers of the IP address
            for (var i in ipParts) {
                if (i > 1 && ipParts[i] == "*") {
                    // mask for sub-net
                    continue;
                }
                // If not numerical or if it's not between 0 and 255
                // TODO: Catch string "e" as it means "10^".
                if (isNaN(ipParts[i]) || ipParts[i] < 0 || ipParts[i] >= 256) {
                    return [logInvalid];
                }
            }
            
            if (ipParts.length != 4) {
                // an IP without 3 decimals
                return [logInvalid];
            }
            ban(ip);
            return answer;
        }
        // if input is a Player ID
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            // If not numerical
            return [logInvalid];
        }
        ip = null;
        for (var i in gameServer.clients) {
            var client = gameServer.clients[i];
            if (client == null || !client.isConnected)
                continue;
            if (client.playerTracker.pID == id) {
                ip = client._socket.remoteAddress;
                break;
            }
        }

        if (ip) return ban(ip);
        else return ["Player ID " + id + " not found!"];
        
        // ban the player
        function ban (ip) {
            var answer = [];
            var ipBin = ip.split('.');
            if (ipBin.length != 4) {
                return ["Invalid IP format: " + ip];
            }
            gameServer.ipBanList.push(ip);
            if (ipBin[2] == "*" || ipBin[3] == "*") {
                answer.push("The IP sub-net " + ip + " has been banned");
            } else {
                answer.push("The IP " + ip + " has been banned");
            }
            gameServer.clients.forEach(function (socket) {
                // If already disconnected or the ip does not match
                if (socket == null || !socket.isConnected || !gameServer.checkIpBan(socket.remoteAddress))
                    return;
            
                // remove player cells
                socket.playerTracker.cells.forEach(function (cell) {
                    gameServer.removeNode(cell);
                }, gameServer);
            
                // disconnect
                socket.close(1000, "Banned from server");
                var name = socket.playerTracker.getFriendlyName();
                answer.push("Banned: \"" + name + "\" with Player ID " + socket.playerTracker.pID);
                gameServer.sendChatMessage(null, null, "Banned \"" + name + "\""); // notify to don't confuse with server bug
            }, gameServer);
            gameServer.saveIpBanList();
            return answer;
        }
    },
    banlist: function (gameServer, split) {
        var answer = [];
        answer.push("Showing " + gameServer.ipBanList.length + " banned IPs: ");
        answer.push(" IP              | IP ");
        answer.push("-----------------------------------");
        for (var i = 0; i < gameServer.ipBanList.length; i += 2) {
            answer.push(" " + fillChar(gameServer.ipBanList[i], " ", 15) + " | " 
                    + (gameServer.ipBanList.length === i + 1 ? "" : gameServer.ipBanList[i + 1])
            );
        }
        return answer;
    },
    kickbot: function (gameServer, split) {
        var toRemove = parseInt(split[1]);
        if (isNaN(toRemove)) {
            toRemove = -1; // Kick all bots if user doesnt specify a number
        }
        if (toRemove < 1) {
            return ["Invalid argument!"];
        }
        var removed = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            var socket = gameServer.clients[i];
            if (socket.isConnected != null) continue;
            socket.close();
            removed++;
            if (removed >= toRemove)
                break;
        }
        if (removed == 0)
            return ["Cannot find any bots"];
        else if (toRemove == removed)
            return ["Kicked " + removed + " bots"];
        else
            return ["Only " + removed + " bots were kicked"];
    },
    board: function (gameServer, split) {
        var answer = [];
        var newLB = [], reset = split[1];
        for (var i = 1; i < split.length; i++) {
            if (split[i]) {
                newLB[i - 1] = split[i];
            } else {
                newLB[i - 1] = " ";
            }
        }
        
        // Clears the update leaderboard function and replaces it with our own
        gameServer.gameMode.packetLB = 48;
        gameServer.gameMode.specByLeaderboard = false;
        gameServer.gameMode.updateLB = function (gameServer) {
            gameServer.leaderboard = newLB;
            gameServer.leaderboardType = 48;
        };
        answer.push("Successfully changed leaderboard values");
        answer.push('Do "board reset" to reset leaderboard');
        if (reset == "reset") {
            // Gets the current gamemode
            var gm = GameMode.get(gameServer.gameMode.ID);
        
            // Replace functions
            gameServer.gameMode.packetLB = gm.packetLB;
            gameServer.gameMode.updateLB = gm.updateLB;
            answer.push("Successfully reset leaderboard");
        }
        return answer;
    },
    change: function (gameServer, split) {
        if (split.length < 3) {
            return ["Invalid command arguments"];
        }
        var key = split[1];
        var value = split[2];
        
        // Check if int/float
        if (value.indexOf('.') != -1) {
            value = parseFloat(value);
        } else {
            value = parseInt(value);
        }
        
        if (value == null || isNaN(value)) {
            return ["Invalid value: " + value];
        }
        if (!gameServer.config.hasOwnProperty(key)) {
            return ["Unknown config value: " + key];
        }
        gameServer.config[key] = value;
        
        // update/validate
        gameServer.config.playerMinSize = Math.max(32, gameServer.config.playerMinSize);
        Logger.setVerbosity(gameServer.config.logVerbosity);
        Logger.setFileVerbosity(gameServer.config.logFileVerbosity);
        return ["Set " + key + " = " + gameServer.config[key]];
    },
    clear: function () {
        return ["what are you trying to do?"]
        // process.stdout.write("\u001b[2J\u001b[0;0H");
    },
    color: function (gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            return ["Please specify a valid player ID!"];
        }
        
        var color = {
            r: 0,
            g: 0,
            b: 0
        };
        color.r = Math.max(Math.min(parseInt(split[2]), 255), 0);
        color.g = Math.max(Math.min(parseInt(split[3]), 255), 0);
        color.b = Math.max(Math.min(parseInt(split[4]), 255), 0);
        
        // Sets color to the specified amount
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.setColor(color); // Set color
                for (var j in client.cells) {
                    client.cells[j].setColor(color);
                }
                break;
            }
        }
        return ["done that"];
    },
    exit: function (gameServer, split) {
        return ["can't do that"];
        gameServer.wsServer.close();
        process.exit(1);
    },
    kick: function (gameServer, split) {
        var answer = [];
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            return ["Please specify a valid player ID!"];
        }
        // kick player
        var count = 0;
        gameServer.clients.forEach(function (socket) {
            if (socket.isConnected == false)
               return ["not connected"];
            if (id != 0 && socket.playerTracker.pID != id)
                return ["don't know."];
            // remove player cells
            socket.playerTracker.cells.forEach(function (cell) {
                gameServer.removeNode(cell);
            }, gameServer);
            // disconnect
            socket.close(1000, "Kicked from server");
            var name = socket.playerTracker.getFriendlyName();
            answer.push("Kicked \"" + name + "\"");
            gameServer.sendChatMessage(null, null, "Kicked \"" + name + "\""); // notify to don't confuse with server bug
            count++;
        }, this);
        if (count > 0) return answer;
        if (id == 0)
            answer.push("No players to kick!");
        else
            answer.push("Player with ID " + id + " not found!");
        return answer;
    },
    mute: function (gameServer, args) {
        var answer = [];
        if (!args || args.length < 2) {
            answer.push("Please specify a valid player ID!");
            return answer;
        }
        var id = parseInt(args[1]);
        if (isNaN(id)) {
            answer.push("Please specify a valid player ID!");
            return answer;
        }
        var player = gameServer.getPlayerById(id);
        if (player == null) {
            answer.push("Player with id=" + id + " not found!");
            return answer;
        }
        if (player.isMuted) {
            answer.push("Player with id=" + id + " already muted!");
            return answer;
        }
        answer.push("Player \"" + player.getFriendlyName() + "\" was muted");
        player.isMuted = true;
        return answer;
    },
    unmute: function (gameServer, args) {
        var answer = [];
        if (!args || args.length < 2) {
            answer.push("Please specify a valid player ID!");
            return answer;
        }
        var id = parseInt(args[1]);
        if (isNaN(id)) {
            answer.push("Please specify a valid player ID!");
            return answer;
        }
        var player = gameServer.getPlayerById(id);
        if (player == null) {
            answer.push("Player with id=" + id + " not found!");
            return answer;
        }
        if (!player.isMuted) {
            answer.push("Player with id=" + id + " already not muted!");
            return answer;
        }
        answer.push("Player \"" + player.getFriendlyName() + "\" were unmuted");
        player.isMuted = false;
        return answer;
    },
    kickall: function (gameServer, split) {
        var answer = [];
        var id = 0; //kick ALL players
        // kick player
        var count = 0;
        gameServer.clients.forEach(function (socket) {
            if (socket.isConnected == false)
               return;
            if (id != 0 && socket.playerTracker.pID != id)
                return;
            // remove player cells
            socket.playerTracker.cells.forEach(function (cell) {
                gameServer.removeNode(cell);
            }, gameServer);
            // disconnect
            socket.close(1000, "Kicked from server");
            var name = socket.playerTracker.getFriendlyName();
            answer.push("Kicked \"" + name + "\"");
            gameServer.sendChatMessage(null, null, "Kicked \"" + name + "\""); // notify to don't confuse with server bug
            count++;
        }, this);
        if (count > 0) return answer;
        if (id == 0)
            answer.push("No players to kick!");
        else
            answer.push("Player with ID " + id + " not found!");
        return answer;
    },
    kill: function (gameServer, split) {
        var answer = [];
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            answer.push("Please specify a valid player ID!");
            return answer;
        }
        
        var count = 0;
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                var len = client.cells.length;
                for (var j = 0; j < len; j++) {
                    gameServer.removeNode(client.cells[0]);
                    count++;
                }
                
                answer.push("Killed " + client.getFriendlyName() + " and removed " + count + " cells");
                break;
            }
        }
        return answer;
    },
    killall: function (gameServer, split) {
        var answer = [];
        var count = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            var playerTracker = gameServer.clients[i].playerTracker;
            while (playerTracker.cells.length > 0) {
                gameServer.removeNode(playerTracker.cells[0]);
                count++;
            }
        }
        answer.push("Removed " + count + " cells");
        return answer;
    },
    mass: function (gameServer, split) {
        var answer = [];
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            answer.push("Please specify a valid player ID!");
            return answer;
        }
        
        var amount = Math.max(parseInt(split[2]), 9);
        if (isNaN(amount)) {
            answer.push("Please specify a valid number");
            return answer;
        }
        var size = Math.sqrt(amount * 100);
        
        // Sets mass to the specified amount
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                for (var j in client.cells) {
                    client.cells[j].setSize(size);
                }
                
                answer.push("Set mass of " + client.getFriendlyName() + " to " + (size * size / 100).toFixed(3));
                break;
            }
        }
        return answer;
    },
    spawnmass: function (gameServer, split) {
        var answer = [];
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            answer.push("Please specify a valid player ID!");
            return;
        }
        
        var amount = Math.max(parseInt(split[2]), 9);
        var size = Math.sqrt(amount * 100);
        if (isNaN(amount)) {
            answer.push("Please specify a valid mass!");
            return;
        }

        // Sets spawnmass to the specified amount
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.spawnmass = size;
                answer.push("Set spawnmass of "+ client.getFriendlyName() + " to " + (size * size / 100).toFixed(3));
            }
        }
        return answer;
    },   
    speed: function (gameServer, split) {
        var answer = [];
        var id = parseInt(split[1]);
        var speed = parseInt(split[2]);
        if (isNaN(id)) {
            answer.push("Please specify a valid player ID!");
            return answer;
        }
        
        if (isNaN(speed)) {
            answer.push("Please specify a valid speed!");
            return answer;
        }

        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.customspeed = speed;
            }
        }
        answer.push("Set base speed of "+ client.getFriendlyName() + " to " + speed);
        return answer;
    },
    merge: function (gameServer, split) {
        var answer = [];
        // Validation checks
        var id = parseInt(split[1]);
        var set = split[2];
        if (isNaN(id)) {
            answer.push("Please specify a valid player ID!");
            return;
        }
        
        // Find client with same ID as player entered
        var client;
        for (var i = 0; i < gameServer.clients.length; i++) {
            if (id == gameServer.clients[i].playerTracker.pID) {
                client = gameServer.clients[i].playerTracker;
                break;
            }
        }
        
        if (!client) {
            answer.push("Client is nonexistent!");
            return;
        }
        
        if (client.cells.length == 1) {
            answer.push("Client already has one cell!");
            return;
        }
        
        // Set client's merge override
        var state;
        if (set == "true") {
            client.mergeOverride = true;
            client.mergeOverrideDuration = 100;
            state = true;
        } else if (set == "false") {
            client.mergeOverride = false;
            client.mergeOverrideDuration = 0;
            state = false;
        } else {
            if (client.mergeOverride) {
                client.mergeOverride = false;
                client.mergeOverrideDuration = 0;
            } else {
                client.mergeOverride = true;
                client.mergeOverrideDuration = 100;
            }
            
            state = client.mergeOverride;
        }
        
        // Log
        if (state) answer.push(client.getFriendlyName() + " is now force merging");
        else answer.push(client.getFriendlyName() + " isn't force merging anymore");
        return answer;
    },
    rec: function (gameServer, split) {
        var answer = [];
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            answer.push("Please specify a valid player ID!");
            return;
        }
        
        // set rec for client
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.rec = !client.rec;
                if (client.rec) answer.push(client.getFriendlyName() + " is now in rec mode!");
                else answer.push(client.getFriendlyName() + " is no longer in rec mode");
            }
        }
        return answer;
    },
    name: function (gameServer, split) {
        var answer = [];
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            answer.push("Please specify a valid player ID!");
            return answer;
        }
        
        var name = split.slice(2, split.length).join(' ');
        if (typeof name == 'undefined') {
            answer.push("Please type a valid name");
            return anwser;
        }
        
        // Change name
        for (var i = 0; i < gameServer.clients.length; i++) {
            var client = gameServer.clients[i].playerTracker;
            
            if (client.pID == id) {
                answer.push("Changing " + client.getFriendlyName() + " to " + name);
                client.setName(name);
                return answer;
            }
        }
        
        // Error
        answer.push("Player " + id + " was not found");
        return answer;
    },
    unban: function (gameServer, split) {
        var answer = [];
        if (split.length < 2 || split[1] == null || split[1].trim().length < 1) {
            answer.push("Please specify a valid IP!");
            return;
        }
        var ip = split[1].trim();
        var index = gameServer.ipBanList.indexOf(ip);
        if (index < 0) {
            answer.push("IP " + ip + " is not in the ban list!");
            return;
        }
        gameServer.ipBanList.splice(index, 1);
        gameServer.saveIpBanList();
        answer.push("Unbanned IP: " + ip);
        return answer;
    },
    playerlist: function (gameServer, split) {
        var answer = [];
        answer.push("Current players: " + gameServer.clients.length);
        answer.push('Do "playerlist m" or "pl m" to list minions');
        answer.push(" ID     | IP              | P | " + fillChar('NICK', ' ', gameServer.config.playerMaxNickLength) + " | CELLS | SCORE  | POSITION    "); // Fill space
        answer.push(fillChar('', '-', ' ID     | IP              |   |  | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNickLength));
        var sockets = gameServer.clients.slice(0);
        sockets.sort(function (a, b) { return a.playerTracker.pID - b.playerTracker.pID; });
        for (var i = 0; i < sockets.length; i++) {
            var socket = sockets[i];
            var client = socket.playerTracker;
            var ip = (client.isMi) ? "[MINION]" : "[BOT]";
            var type = split[1];
            
            // list minions
            if (client.isMi) {
                if (typeof type == "undefined" || type == "" || type != "m") {
                    continue;
                } else if (type == "m") {
                    ip = "[MINION]";
                }
            }
            
            // ID with 3 digits length
            var id = fillChar((client.pID), ' ', 6, true);
            
            // Get ip (15 digits length)
            if (socket.isConnected != null) {
                ip = socket.remoteAddress;
            }
            ip = fillChar(ip, ' ', 15);
            var protocol = gameServer.clients[i].packetHandler.protocol;
            if (protocol == null)
                protocol = "?";
            // Get name and data
            var nick = '',
                cells = '',
                score = '',
                position = '',
                data = '';
            if (socket.closeReason != null) {
                // Disconnected
                var reason = "[DISCONNECTED] ";
                if (socket.closeReason.code)
                    reason += "[" + socket.closeReason.code + "] ";
                if (socket.closeReason.message)
                    reason += socket.closeReason.message;
                answer.push(" " + id + " | " + ip + " | " + protocol + " | " + reason);
            } else if (!socket.packetHandler.protocol && socket.isConnected) {
                answer.push(" " + id + " | " + ip + " | " + protocol + " | " + "[CONNECTING]");
            } else if (client.spectate) {
                nick = "in free-roam";
                if (!client.freeRoam) {
                    var target = client.getSpectateTarget();
                    if (target != null) {
                        nick = target.getFriendlyName();
                    }
                }
                data = fillChar("SPECTATING: " + nick, '-', ' | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNickLength, true);
                answer.push(" " + id + " | " + ip + " | " + protocol + " | " + data);
            } else if (client.cells.length > 0) {
                nick = fillChar(client.getFriendlyName(), ' ', gameServer.config.playerMaxNickLength);
                cells = fillChar(client.cells.length, ' ', 5, true);
                score = fillChar((client.getScore() / 100) >> 0, ' ', 6, true);
                position = fillChar(client.centerPos.x >> 0, ' ', 5, true) + ', ' + fillChar(client.centerPos.y >> 0, ' ', 5, true);
                answer.push(" " + id + " | " + ip + " | " + protocol + " | " + nick + " | " + cells + " | " + score + " | " + position);
            } else {
                // No cells = dead player or in-menu
                data = fillChar('DEAD OR NOT PLAYING', '-', ' | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNickLength, true);
                answer.push(" " + id + " | " + ip + " | " + protocol + " | " + data);
            }
        }
        return answer;
    },
    pause: function (gameServer, split) {
        gameServer.run = !gameServer.run; // Switches the pause state
        var s = gameServer.run ? "Unpaused" : "Paused";
        return [s + " the game."];
    },
    freeze: function (gameServer, split) {
        var answer = [];
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            answer.push("Please specify a valid player ID!");
            return answer;
        }

        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.frozen = !client.frozen;
                if (client.frozen) {
                    answer.push("Froze " + client.getFriendlyName());
                } else {
                    answer.push("Unfroze " + client.getFriendlyName());
                }
                break;
            }
        }
        return answer;
    },
    reload: function (gameServer) {
        gameServer.loadConfig();
        gameServer.loadIpBanList();
        return ["Reloaded the config file succesully"];
    },
    status: function (gameServer, split) {
        var answer = [];
        var ini = require('./ini.js');
        // Get amount of humans/bots
        var humans = 0,
            bots = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            if ('_socket' in gameServer.clients[i]) {
                humans++;
            } else {
                bots++;
            }
        }
        
        answer.push("Connected players: " + gameServer.clients.length + "/" + gameServer.config.serverMaxConnections);
        answer.push("Players: " + humans + " - Bots: " + bots);
        answer.push("Server has been running for " + Math.floor(process.uptime() / 60) + " minutes");
        answer.push("Current memory usage: " + Math.round(process.memoryUsage().heapUsed / 1048576 * 10) / 10 + "/" + Math.round(process.memoryUsage().heapTotal / 1048576 * 10) / 10 + " mb");
        answer.push("Current game mode: " + gameServer.gameMode.name);
        answer.push("Current update time: " + gameServer.updateTimeAvg.toFixed(3) + " [ms]  (" + ini.getLagMessage(gameServer.updateTimeAvg) + ")");
        return answer;
    },
    
    //Aliases
    st: function (gameServer, split) { // Status
        return Commands.list.status(gameServer, split);
    },
    pl: function (gameServer, split) { // Playerlist
        return Commands.list.playerlist(gameServer, split);
    },
    m: function (gameServer, split) { // Mass
        return Commands.list.mass(gameServer, split);
    },
    sm: function (gameServer, split) { // Spawnmass
        return Commands.list.spawnmass(gameServer, split);
    },
    ka: function (gameServer, split) { // Killall
        return Commands.list.killall(gameServer, split);
    },
    k: function (gameServer, split) { // Kill
        return Commands.list.kill(gameServer, split);
    },
    mg: function (gameServer, split) { // Merge
        return Commands.list.merge(gameServer, split);
    },
    s: function (gameServer, split) { // Speed
        return Commands.list.speed(gameServer, split);
    }
};
