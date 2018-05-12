var sum_allocated, sum_claimed, allocated_percent, claimed_percent;
var total_supply;
var contract_address;
var BigNumber = require("bignumber.js");
// const Web3 = require("web3");

const mainnet_address = "0xefbd6d7def37ffae990503ecdb1291b2f7e38788";

//const http_provider = "http://127.0.0.1:8545";
const INFURA_APIKEY = "a8D3zGuYfoDaYcVyQd8t";
const http_provider = "https://mainnet.infura.io/" + INFURA_APIKEY;

let appInstance;

App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // // Initialize web3 and set the provider to the testRPC.
    if (typeof web3 !== "undefined") {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
      // console.log("aaa", web3.currentProvider);
    } else {
      // set the provider you want from Web3.providers
      App.web3Provider = new Web3.providers.HttpProvider(http_provider);
      web3 = new Web3(App.web3Provider);
      // console.log("aaa2222");
    }

    // App.web3Provider = new Web3.providers.HttpProvider(http_provider);
    // web3 = new Web3(App.web3Provider);

    console.log(web3);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON("EvoDistribution.json", function(data) {
      // console.log("data", data);
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      var EvoDistributionArtifact = data;
      App.contracts.EvoDistribution = TruffleContract(
        EvoDistributionArtifact
      );

      // Set the provider for our contract.
      App.contracts.EvoDistribution.setProvider(App.web3Provider);

      if (http_provider == "https://mainnet.infura.io/" + INFURA_APIKEY) {
        appInstance = App.contracts.EvoDistribution.at(mainnet_address);
        // console.log("aaabbbb", appInstance);

        // appInstance.INITIAL_SUPPLY().then(function(result) {
        //   console.log("????", result);
        // });
      } else {
        appInstance = App.contracts.EvoDistribution.deployed();
        // console.log("aaabbbbb2222");
      }
      // return;
      // var allocationEvent = appInstance.LogNewAllocation();

      // allocationEvent.get(function(error, result) {
      //   if (error) console.log(error);
      //   console.log("new allocation detected1", error, result);
      // });

      return App.getBalances();
    });

    return App.bindEvents();
  },

  initEVOContract: function(contract_address) {
    console.log("initiate Evo token");
    $.getJSON("EvoToken.json", function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      var EvoTokenArtifact = data;
      // console.log(data);
      App.contracts.EvoToken = TruffleContract(EvoTokenArtifact);

      // Set the provider for our contract.
      App.contracts.EvoToken.setProvider(App.web3Provider);

      var appInstance2;
      var evoTokenInstance;

      if (http_provider == "https://mainnet.infura.io/" + INFURA_APIKEY) {
        appInstance2 = App.contracts.EvoToken.at(contract_address);
        // console.log("aaabbbb", appInstance);

        // appInstance.INITIAL_SUPPLY().then(function(result) {
        //   console.log("????", result);
        // });
      } else {
        appInstance2 = App.contracts.EvoToken.deployed();
      }
      console.log(appInstance2);
      // return;

      // appInstance2.then(function(instance) {
      //   evoTokenInstance = instance;
      //   console.log(instance);

      //   evoTokenInstance.totalSupply().then(function(result) {
      //     console.log(result);
      //   });
      // });

      /* var events = appInstance2.allEvents({ fromBlock: 0, toBlock: "latest" });
      events.get(function(error, log) {
        event_data = log;
        console.log("events", event_data);
        $.each(event_data, function(index, value) {
          // console.log(value);
          $("#table_div").append(
            "<tr><td>" +
              value.args.to +
              "</td><td>" +
              value.args.value.c[0] +
              "</td></tr>"
          );
        });
      }); */

      // return App.getBalances();
    });

    return;
  },

  bindEvents: function() {
    $(document).on("click", "#allocation_button", function() {
      var _recipient = $("#recipient_address").val();
      console.log("Start allocation to " + _recipient);

      appInstance.then(function(instance) {
        evoDistributionInstance = instance;
        console.log(instance);

        var _totalAllocated = 5000000000 * 10 ** 18;
        var _supply = 0; //presale supply

        evoDistributionInstance
          .setAllocation(_recipient, _totalAllocated, _supply)
          .then(function(result) {
            console.log(result);
          })
          .catch(function(error) {
            console.log(error.message);
          });
      });
    });

    $(document).on("click", "#transaction_button", function() {
      var _recipient = $("#recipient_address").val();
      console.log("Send transaction to " + _recipient);

      appInstance.then(function(instance) {
        evoDistributionInstance = instance;
        console.log(instance);

        evoDistributionInstance
          .transferTokens(_recipient)
          .then(function(result) {
            console.log(result);
          })
          .catch(function(error) {
            console.log(error.message);
          });
      });
    });
  },

  getBalances: function() {
    console.log("Getting contract instance....");

    var evoDistributionInstance;

    function calculatePercentage(result, allocation_supply) {
      var available_supply = web3.fromWei(result, "ether").toNumber();
      // console.log(available_supply);
      // console.log(available_supply / allocation_supply);

      progress_value = parseInt(available_supply / allocation_supply * 100);
      // console.log("Percent:", progress_value);
      return progress_value;
    }

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      console.log(accounts);

      var account = accounts[0];
      console.log(account);

      appInstance
        .then(function(instance) {
          console.log("aaaaaaa");
          evoDistributionInstance = instance;

          console.log(instance);

          var total_allocated = 0;
          var total_claimed = 0;
          var total_supply = 0;

          // var allocationEvent = instance.LogNewAllocation();

          // allocationEvent.get(function(error, result) {
          //   if (error) console.log(error);
          //   console.log("new allocation detected2", error, result);
          // });

          // allocated_percent = 50;

          // console.log(evoDistributionInstance.INITIAL_SUPPLY().call());

          evoDistributionInstance.EVO().then(function(result) {
            console.log(result);

            var evoTokenInstance = result;

            App.initEVOContract(result);

            // appInstance = App.contracts.EvoDistribution.at(result);

            // console.log(appInstance);
          });

          evoDistributionInstance.INITIAL_SUPPLY().then(function(result) {
            console.log("#TotalSupply_Balance", result);

            $("#TotalSupply_Balance").text(result.toNumber());

            total_supply = result.toNumber();

            evoDistributionInstance
              .AVAILABLE_TOTAL_SUPPLY()
              .then(function(result) {
                console.log("#AvailableSupply_Balance", result.toNumber());
                var available_supply = result.toNumber();
                console.log(available_supply / total_supply * 100);
                var available_percent = available_supply / total_supply * 100;

                var g1 = new JustGage({
                  id: "gauge1",
                  value: available_percent,
                  min: 0,
                  max: 100,
                  title: "Circulating Supply"
                });
              });

            // total_supply = 100000;
            // $("#TTBalance").text(result.c[0]);

            evoDistributionInstance
              .grandTotalAllocated()
              .then(function(result) {
                console.log("Grand Total Allocated", result.toNumber());
                sum_allocated = result.toNumber();
                console.log(sum_allocated, total_supply);
                if (sum_allocated > 0) {
                  allocated_percent = sum_allocated / total_supply * 100;
                  console.log(allocated_percent);
                } else {
                  allocated_percent = 0;
                }

                var g2 = new JustGage({
                  id: "gauge2",
                  value: allocated_percent,
                  min: 0,
                  max: 100,
                  title: "% Supply Allocated"
                });

                $("#total_allocated").text(
                  web3.fromWei(result, "ether").toString(10)
                );
                // $("#TTBalance").text(result.c[0]);
              });

            evoDistributionInstance.grandTotalClaimed().then(function(result) {
              console.log("Grand Total Claimed", result.toNumber());

              sum_claimed = result.toNumber();

              if (sum_claimed > 0) {
                claimed_percent = sum_claimed / total_supply * 100;
                console.log(claimed_percent);
              } else {
                claimed_percent = 0;
              }

              var g3 = new JustGage({
                id: "gauge3",
                value: claimed_percent,
                min: 0,
                max: 100,
                title: "% Supply Claimed"
              });

              $("#total_claimed").text(
                web3.fromWei(result, "ether").toString(10)
              );
              // $("#TTBalance").text(result.c[0]);
            });
          });

          evoDistributionInstance
            .AVAILABLE_AIRDROP_SUPPLY()
            .then(function(result) {
              console.log(
                "#AirdropSupply_Balance",
                web3.fromWei(result, "ether").toString(10)
              );

              // var reserve_supply = web3.fromWei(result, "ether").toNumber();
              // console.log(reserve_supply);
              // console.log(reserve_supply, 495000000);

              // progress_value = parseInt(reserve_supply / 495000000 * 100);
              // console.log(progress_value);

              progress_value = calculatePercentage(result, 2500000000);

              $("#airdrop_progress").css("width", progress_value + "%");
              $("#airdrop_progress").text(progress_value + "%");

              $("#AirdropSupply_Balance").text(
                web3.fromWei(result, "ether").toString(10)
              );
            });
          return;
        })
        .then(function(result) {
          //do something
          // console.log(allocated_percent);
        })
        .catch(function(err) {
          console.log(err.message);
        });
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
    setTimeout(function(){
      location.reload()
    }, 15000);
  });
});
