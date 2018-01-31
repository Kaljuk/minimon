/*
Erik Kaljumäe
2018 January

Minimon for compiling and running mostly
single java files. Java version of nodemon.

*/




// Require

const chalk      = require('chalk');
const { spawn }  = require('child_process');
const chokidar   = require('chokidar');
// Get target file name
let target = (process.argv.length>2)?process.argv[2]:'!';
// target = (target.match(/(.*)\./))?target.match(/(.*)\./)[1]:target.match(/(.*)\./)[0];
target = target.replace(/\.java/g,'');
const fn = target;
// console.log('t',target,'t');
// If filename is faulty -> Exit



// For ease of use
const log = console.log;
const minimonLogo = `
                                                           |
   ______  _       _                                       |
  |  ___ \\(_)     (_)                                      |
  | | _ | |_ ____  _ ____   ___  ____                      |
  | || || | |  _ \\| |    \\ / _ \\|  _ \\                     |
  | || || | | | | | | | | | |_| | | | |                    |
  |_||_||_|_|_| |_|_|_|_|_|\\___/|_| |_|                    |
  m     i     n     i     m     o     n                    |
                                                           |
`;
const colors = {
  easyGreen: '#a8cc8c'
}
// Functions

//  --  Illustrative --
// Show logo
let showLogo = function(dark) {
  if (dark == 'undefined' || dark == false) {
    if (chalk.level < 1) {
      log(chalk.blue.bgBlackBright(minimonLogo));
    } else {
      log(chalk.blue.bgHex(colors.easyGreen)(minimonLogo));
    }
  } else {
    log(chalk.grey(minimonLogo));
  }
}
// Show what level support the line interface has
let showColorLevel = function() {
  let lvl = chalk.level;
  log(chalk.white.bgBlueBright(
    (lvl==0)?'All colors disabled':
    (lvl==1)?'Basic color support (16 colors)':
    (lvl==2)?'256 color support':
    (lvl==3)?'True color support (16 million colors)':'Unknown'
  ))

}
// Display error
let showError = function(err, important, highlight) {
  const impotxt = chalk.redBright.bgWhite('!! ->'+' ');
  log(
    //(highlight)?impotxt+chalk.redBright.bgWhite(highlight):
    (important)?impotxt+chalk.redBright.bgWhite(err):
    chalk.redBright(err)
  )
}
// Minimon visual feedback
let minimonSay = function(msg, who) {
  log(
    (who && who=='minimon')?
    chalk.blueBright.bgBlack('[Minimon] ')+
    chalk.blueBright(msg) :
    (who && who=='output')?
    chalk.blue('<Output>'):
    chalk.white(msg)
  );
}
let minimonError = function(msg, who) {
  log(
    (who && who=='minimon')?
    chalk.redBright('[Minimon] ')+
    chalk.redBright(msg) :
    chalk.white(msg)
  );
}
let minimonWarning = function(msg, who) {
  log(
    (who && who=='minimon')?
    chalk.yellowBright('[Minimon] ')+
    chalk.yellowBright(msg) :
    chalk.white(msg)
  );
}
//  --  FUNCTIONS FOR: Compiling and running java files --
// Find the file to watch
let findFile = function(fileToFind) {
  return new Promise( (resolv, reject) => {
    let foundFile = false;
    // Start compiling the .java file to .class file
    const finderChild = spawn('ls', [], { cwd: __dirname});
    // When find command is done -> promise out
    let finderResolve = new Promise( (resolve) => {
      finderChild.on('exit', resolve);
    });
    // Show Directory Contents command output
    finderChild.stdout.on('data', (data) => {
      //minimonSay(data);
      if (data.includes(fileToFind+'.java')) {
        foundFile = true;
      }
    });
    // Error handling
    finderChild.on('error', (code, signal)=>{
      log(code, signal);
    })

    // Feedback from compiling
    finderResolve.then( (code, signal) => {
      // log('Exited with', 'code', code, 'signal', signal);
      // If no errors then resolve
      if (code == 0 && (signal == 'undefined' || signal == null)) {
        if (foundFile) {
          // minimonSay('Found file '+fileToFind+'.java', 'minimon');
          resolv({success:true}); // -> run and compile
        } else {
          minimonError('File not found '+fileToFind+'.java', 'minimon');
          minimonWarning('You can continue and create the file or restart with another filename', 'minimon');
          reject({success:false}); // -> do nothing
        }
      }
    });
  })
}
// Compile file
let compileFile = function() {
  return new Promise( (resolv, reject) => {
    // Start compiling the .java file to .class file
    const compileChild = spawn('javac', [target+'.java']);
    // Connect to promise
    let compileResolve = new Promise( (resolve) => {
      compileChild.on('exit', resolve);
    });
    let compileErrors  = new Promise( (resolve) => {
      compileChild.on('error', reject);
    })

    // Feedback from compiling
    compileResolve.then( (code, signal) => {
      // log('Exited with', 'code', code, 'signal', signal);
      // If no errors then resolve
      if (code == 0 && (signal == 'undefined' || signal == null)) {
        minimonSay('Compile successful', 'minimon');
        resolv({success:true});
      }
    });
  })
};
// Run the file
let runFile = function() {
  minimonSay('Running class file', 'minimon');
  return new Promise( (resolv) => {
    // Run the compiled .class file
    const runChild = spawn('java', [target]);
    // Connect result to promise
    let runResolve = new Promise( (resolve) => {
      runChild.on('exit', resolve);
    });
    // Show run output
    let sayoutput = true;
    runChild.stdout.on('data', (data) => {
      if (sayoutput) {minimonSay('', 'output');sayoutput=false};
      //NOTE: when run is over, then '\r\n' message is in output
      // log(data, data.toString('utf8'));
      minimonSay(data);
    });
    // When the run ends
    runResolve.then( (code, signal) => {
      minimonSay('Run successful', 'minimon');
      resolv({success:true});
    })
  })
};




// // // // MAIN // // // //
showLogo()
showColorLevel();
minimonSay('Minimon operational', 'minimon');

// showError('File not found in the folder', true);
// showError('Loading... [longer than expected]');

// Watch and recompile when file is changed

if (fn == '!') {
  minimonError('No filename found', 'minimon');
  minimonError('Please add filename as an argument', 'minimon');
  minimonSay('Like this: minimon myfilename', 'minimon');
  process.exit(0);
}

// If you find the file -> compile and run it
findFile(fn)
  .then( compileFile)
  .then( runFile)
  .catch( ()=> {
    log('Caught something');
  })

var currentRide;

let watcher = chokidar.watch(fn+'.java');
watcher.on('add', (path) => {
  log('Found your file '+ path);
  minimonSay('Observing changes to '+path, 'minimon');
})
watcher.on('change', (path) => {
  log('File', path, 'has been changed');
  
  currentRide = compileFile()
    .then( runFile )
    .then( (msg) => {
      minimonSay('Waiting for further changes...');
    })
});
