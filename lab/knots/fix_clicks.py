path = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/script.js'
with open(path, 'r') as f:
    js = f.read()

target = """    };

    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
}"""

replacement = """    };

    myChart.setOption(option);

    // Make bubbles clickable
    myChart.on('click', function (params) {
        if (params.data && params.data.hash) {
            window.open(`https://github.com/bitcoinknots/bitcoin/commit/${params.data.hash}`, '_blank');
        }
    });

    window.addEventListener('resize', () => myChart.resize());
}"""

if target in js:
    js = js.replace(target, replacement)
    with open(path, 'w') as f:
        f.write(js)
    print("Added click listener to Graveyard chart.")
else:
    print("Could not find target string in script.js.")
