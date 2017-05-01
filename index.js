/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

const yargs = require('yargs'),
      sqlite3 = require('sqlite3'),
      htmlparser2 = require('htmlparser2'),
      http = require('http');

const argv = yargs
      .usage('Usage: $0 [options]')
      .command('')
      .alias({'help': 'h', 'sqlite-db': 'd', 'username': 'u', 'fulldom-server': 's'})
      .describe({
	      'sqlite-db': 'Path to the SQLite database to put data in',
	      username: 'Instagram username to scrape',
	      'fulldom-server': 'URL that fulldom-server is running on, including protocol scheme'
      })
      .default({ 'fulldom-server': 'http://localhost:8000' })
      .demand(['username', 'sqlite-db'])
      .help()
      .version()
      .epilog(['Copyright (C) 2017 Alex Jordan <alex@strugee.net>.',
               'License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl-3.0.html>.',
               'This is free software: you are free to change and redistribute it. There is NO WARRANTY, to the extent permitted by law.'].join('\n'))
      .argv;

const db = new sqlite3.Database(argv['sqlite-db'], createTables);

function createTables() {
	db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT)', (err) => {
		if (err) throw err;

		db.run('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, url TEXT, username INTEGER, last_seen INTEGER, deleted INTEGER, FOREIGN KEY (username) REFERENCES users (id))', (err) => {
			if (err) throw err;

			db.run('CREATE TABLE IF NOT EXISTS likes (id INTEGER PRIMARY KEY, post INTEGER, liker INTEGER, FOREIGN KEY (post) REFERENCES posts (id), FOREIGN KEY (liker) REFERENCES users (id))', (err) => {
				if (err) throw err;

				db.run('CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY, post INTEGER, comment_text TEXT, FOREIGN KEY (post) REFERENCES posts (id))', (err) => {
					if (err) throw err;

					db.run('CREATE TABLE IF NOT EXISTS comment_likes (id INTEGER PRIMARY KEY, comment INTEGER, liker INTEGER, FOREIGN KEY (comment) REFERENCES comments (id), FOREIGN KEY (liker) REFERENCES users (id))', (err) => {
						if (err) throw err;

						scrapeInitial();
					});
				});
			});
		});
	});
}

function scrapeInitial() {
	// TODO handle weirdass usernames
	http.get(argv['fulldom-server'] + '/https%3A%2F%2Finstagram.com%2F' + argv.username + '%2F?selector=article%20div%20div%20div%20a', (res) => {
		if (res.statusCode < 200 || res.statusCode >= 300) {
			throw new Error('got non-2xx response on initial scraping');
		}

	});
}
